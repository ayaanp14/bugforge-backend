import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import type { DefaultEventsMap } from "socket.io";
import authRouter from "./routes/auth.js";
import oauthRouter from "./routes/oauth.js";
import interviewsVoiceRouter from "./routes/interviews-voice.js";
import billingRouter from "./routes/billing.js";
import campusRouter from "./routes/campus.js";
import meRouter from "./routes/me.js";
import problemsRouter from "./routes/problems.js";
import executionRouter from "./routes/execution.js";
import leaderboardRouter from "./routes/leaderboard.js";
import bugChallengesRouter from "./routes/bug-challenges.js";
import pairRoomsRouter from "./routes/pair-rooms.js";
import interviewsRouter from "./routes/interviews.js";
import communityRouter from "./routes/community.js";
import duelsRouter from "./routes/duels.js";
import feedbackRouter from "./routes/feedback.js";
import aptitudeRouter from "./routes/aptitude.js";
import mockTestsRouter from "./routes/mock-tests.js";
import { optionalAuth } from "./middleware/auth.js";
import { platformGuard } from "./middleware/platformGuard.js";
import { securityHeaders } from "./middleware/security-headers.js";
import { authLimiter, generalLimiter, otpRequestLimiter } from "./middleware/rate-limit.js";
import { prisma } from "./lib/prisma.js";
import { setIo, duelRoom } from "./lib/realtime.js";
import { warmRedis, closeRedis } from "./lib/redis.js";
import { startCacheInvalidationListener } from "./lib/cache.js";
import { encodeCode } from "./lib/obfuscation.js";
import { generateRecoveryCode } from "./lib/room-codes.js";
import { readSessionToken, cookieFromHeader, SESSION_COOKIE } from "./lib/auth-session.js";
import { isSessionRevoked } from "./lib/session-revocation.js";

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env["PORT"] ?? 3001);

/**
 * Railway's proxy reuses idle upstream connections. Node closes an idle
 * keep-alive socket after 5s by default, so a request the proxy sent down a
 * connection Node had just decided to drop surfaced to the user as a random
 * 502. Outliving the proxy's own idle window (60s) means Node is never the
 * side that hangs up first; headersTimeout has to exceed keepAliveTimeout or
 * Node refuses the pairing.
 */
httpServer.keepAliveTimeout = 65_000;
httpServer.headersTimeout = 66_000;

// Not a defence, but there is no reason to tell a scanner which framework
// and version to look up. Disabled once here rather than stripped per response.
app.disable("x-powered-by");

/** Per-socket chatter (connect, join, identify) only when asked for. */
const SOCKET_DEBUG = process.env["SOCKET_DEBUG_LOGS"] === "true";
const socketDebug = (...args: unknown[]): void => {
  if (SOCKET_DEBUG) console.log(...args);
};

/**
 * One proxy sits in front of this service in production. Saying so is what
 * makes `req.ip` the caller's address rather than the load balancer's, and
 * every rate limit is keyed on that: without it the whole internet shares one
 * bucket and a single attacker locks everyone out.
 *
 * It is deliberately the number 1 and not `true`. Trusting every hop would let
 * a caller prepend their own X-Forwarded-For and choose which address they are
 * limited as, which defeats the limiting entirely.
 */
app.set("trust proxy", 1);
// Trailing slash stripped: browser Origin headers never include one, and
// CORS origin matching is an exact string comparison
const FRONTEND_URL = (process.env["FRONTEND_URL"] ?? "http://localhost:3000").replace(/\/+$/, "");

/**
 * Every header the SPA (and the mobile app) puts on a request. Anything not
 * listed is refused at preflight, so keep this in step with
 * frontend/src/lib/client-api.ts and store/api/apiSlice.ts.
 */
const ALLOWED_HEADERS = ["Content-Type", "Authorization", "X-App-Platform", "X-App-Signature", "X-App-Timestamp"];

// --- Socket.io Setup ---

/** What the handshake middleware learns about a socket. */
interface SocketData {
  /** The account behind a verified session token; absent on an anonymous socket. */
  userId?: string;
}

const io = new Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ALLOWED_HEADERS,
    credentials: true
  }
});

// Routes push duel updates through this handle rather than importing the server
setIo(io);

/**
 * Who is on the other end of a socket.
 *
 * The SPA sends its session JWT as `auth.token` on the handshake; older
 * clients send nothing there, but the `__session` cookie rides along on a
 * credentialed connection, so that is checked too. Whatever is found is
 * verified the same way as an HTTP Bearer token, revocation included.
 *
 * An anonymous socket is still let through: the clients are being moved to
 * `auth.token` in parallel and this must not cut them off meanwhile. What
 * changes is that a verified identity, when present, overrides anything the
 * client later claims about itself, and the one privileged action (kicking)
 * requires it.
 */
io.use(async (socket, next) => {
  try {
    const fromAuth: unknown = socket.handshake.auth?.["token"];
    const token =
      (typeof fromAuth === "string" && fromAuth) ||
      cookieFromHeader(socket.handshake.headers.cookie, SESSION_COOKIE);
    const claims = token ? readSessionToken(token) : null;
    if (claims && !(await isSessionRevoked(claims.userId, claims.iat))) {
      socket.data.userId = claims.userId;
    }
  } catch (err) {
    console.error("Socket handshake auth error:", err);
  }
  next();
});

// Tracks socket.id -> { roomId, userId, isHost, slug } for room dissolution
const socketMetadata = new Map<string, { roomId: string, userId: string, isHost: boolean, slug: string }>();

// Room cleanup timers to avoid closing on brief refresh
const roomCleanupTimers = new Map<string, NodeJS.Timeout>();

async function softDeleteRoom(roomId: string, slug: string) {
  try {
    console.log(`🧹 Soft-deleting room ${roomId} (status -> closed)`);
    await prisma.pairRoom.update({
      where: { id: roomId },
      data: { status: "closed", endedAt: new Date() }
    });
    io.to(roomId).emit("room-ended", { slug });
    roomLatestCode.delete(roomId);
    roomAudioParticipants.delete(roomId);
  } catch (err) {
    console.error("Soft delete room error:", err);
  }
}

async function handleParticipantLeave(roomId: string, userId: string, slug: string) {
  try {
    // Note: We don't delete participants for history, but we need to track active ones.
    // For now, we rely on checking if any sockets are still in the room channel.
    const socketsInRoom = await io.in(roomId).fetchSockets();
    if (socketsInRoom.length === 0) {
      // Last person left, start cleanup timer
      if (roomCleanupTimers.has(roomId)) clearTimeout(roomCleanupTimers.get(roomId)!);
      
      const timer = setTimeout(() => {
        softDeleteRoom(roomId, slug);
        roomCleanupTimers.delete(roomId);
      }, 20000); // 20 second grace period for refresh
      
      roomCleanupTimers.set(roomId, timer);
    }
  } catch (err) {
    console.error("handleParticipantLeave error:", err);
  }
}

// Latest editor code per active room — a late joiner receives the current
// buffer immediately instead of waiting for the next keystroke.
const roomLatestCode = new Map<string, string>();

/**
 * Who is on the voice call in each room.
 *
 * Module scope, like the code buffer above. This used to be created inside the
 * connection handler, which made it per-socket: each participant kept a private
 * list of who they had heard join, nobody's list agreed, and it vanished with
 * the socket. Cleared when the room closes and pruned as people drop.
 */
const roomAudioParticipants = new Map<string, Set<string>>();

/** Take someone off a room's call and tell the room, if they were on it. */
function dropAudioParticipant(roomId: string, userId: string): void {
  const call = roomAudioParticipants.get(roomId);
  if (!call?.delete(userId)) return;
  if (call.size === 0) roomAudioParticipants.delete(roomId);
  io.to(roomId).emit("user-left-audio", { userId });
  io.to(roomId).emit("audio-participants-update", Array.from(call));
}

io.on("connection", (socket) => {
  socketDebug(`🔌 New client connected: ${socket.id}${socket.data.userId ? ` (user ${socket.data.userId})` : ""}`);

  // A verified socket is addressable by account from the start, whether or
  // not the client remembers to identify itself.
  if (socket.data.userId) socket.join(`user_${socket.data.userId}`);

  // ── Kumite: one room per duel, so /api/duels can push straight to both sides
  socket.on("join-duel", (duelId: string) => {
    if (typeof duelId === "string" && duelId) socket.join(duelRoom(duelId));
  });
  socket.on("leave-duel", (duelId: string) => {
    if (typeof duelId === "string" && duelId) socket.leave(duelRoom(duelId));
  });

  socket.on("join-room", async (roomId: string, claimedUserId: string) => {
    // The verified identity wins over whatever the client says it is; the
    // claim is only used for sockets that connected without a session.
    const userId = socket.data.userId ?? claimedUserId;
    socket.join(roomId);

    // Push the room's current code straight to the joining socket.
    const latestCode = roomLatestCode.get(roomId);
    if (latestCode) socket.emit("code-update", latestCode);
    socketDebug(`👤 Client ${socket.id} (User: ${userId}) joined room: ${roomId}`);

    try {
      const room = await prisma.pairRoom.findUnique({
        where: { id: roomId },
        include: {
          problem: { select: { slug: true } },
          participants: {
            include: { user: { select: { id: true, name: true, avatar_url: true } } }
          }
        }
      });

      if (room) {
        const participant = room.participants.find((p: any) => p.userId === userId);
        if (participant) {
          socketMetadata.set(socket.id, { 
            roomId, 
            userId, 
            isHost: participant.role === "host",
            slug: room.problem.slug
          });
        }
        const participants = room.participants.map((p: any) => ({
          userId: p.userId,
          name: p.user.name,
          avatar_url: p.user.avatar_url,
          role: p.role
        }));
        io.to(roomId).emit("participant-update", participants);
      }
    } catch (err) {
      console.error("Socket join-room error:", err);
    }
  });

  socket.on("identify-user", (claimedUserId: string) => {
    const verified = socket.data.userId;
    if (verified) {
      // Already joined on connect. A client naming some other account gets
      // ignored rather than granted: that room carries private events.
      if (typeof claimedUserId === "string" && claimedUserId && claimedUserId !== verified) {
        socketDebug(`🆔 Socket ${socket.id} claimed user ${claimedUserId} but is verified as ${verified}; ignoring`);
      }
      return;
    }
    // Anonymous handshake (a client not yet sending auth.token): the claim is
    // all there is to go on, as before.
    if (typeof claimedUserId !== "string" || !claimedUserId) return;
    socket.join(`user_${claimedUserId}`);
    socketDebug(`🆔 Socket ${socket.id} identified as user ${claimedUserId} (unverified)`);
  });

  socket.on("user-joined-notify", ({ roomId, name }: { roomId: string, name: string }) => {
    socket.to(roomId).emit("user-joined", { name });
  });

  socket.on("code-update", ({ roomId, code }: { roomId: string, code: string }) => {
    roomLatestCode.set(roomId, code);
    socket.to(roomId).emit("code-update", code);
  });

  socket.on("cursor-update", ({ roomId, userId, cursor }: { roomId: string, userId: string, cursor: any }) => {
    socket.to(roomId).emit("cursor-update", { userId, cursor });
  });

  socket.on("chat-message", ({ roomId, message }: { roomId: string, message: any }) => {
    io.to(roomId).emit("chat-message", message);
  });

  socket.on("typing", ({ roomId, userId, name, isTyping }: { roomId: string, userId: string, name: string, isTyping: boolean }) => {
    socket.to(roomId).emit("partner-typing", { userId, name, isTyping });
  });

  socket.on("remote-run-start", ({ roomId }: { roomId: string }) => {
    socket.to(roomId).emit("remote-run-start");
  });

  socket.on("remote-run-results", ({ roomId, results }: { roomId: string, results: any }) => {
    socket.to(roomId).emit("remote-run-results", { results });
  });

  socket.on("remote-submit-start", ({ roomId }: { roomId: string }) => {
    socket.to(roomId).emit("remote-submit-start");
  });

  socket.on("remote-submit-results", ({ roomId, results }: { roomId: string, results: any }) => {
    socket.to(roomId).emit("remote-submit-results", results);
  });

  socket.on("kick-participant", async ({ roomId, targetUserId }: { roomId: string, targetUserId: string }) => {
    try {
      // 1. Only the room's host may kick, and only a verified socket can be
      //    the host: the claim a client makes about itself is not enough for
      //    an action that removes someone else.
      const requesterId = socket.data.userId;
      if (!requesterId) {
        socketDebug(`🚫 kick-participant from unverified socket ${socket.id} refused`);
        return;
      }
      if (typeof roomId !== "string" || typeof targetUserId !== "string" || !roomId || !targetUserId) return;

      const host = await prisma.roomParticipant.findFirst({
        where: { roomId, role: "host" },
        select: { userId: true },
      });
      if (!host || host.userId !== requesterId) {
        console.warn(`kick-participant: user ${requesterId} is not the host of room ${roomId}; refused`);
        return;
      }
      // The host cannot kick themselves out of their own room.
      if (targetUserId === requesterId) return;

      // 2. Remove participant from database & Add to Kicked List & Generate Recovery Hash
      await prisma.roomParticipant.deleteMany({
        where: { roomId, userId: targetUserId }
      });

      const currentRoom = await prisma.pairRoom.findUnique({ where: { id: roomId }, select: { recoveryCode: true } });
      await prisma.pairRoom.update({
        where: { id: roomId },
        data: {
          kickedUserIds: {
            push: targetUserId
          },
          // A kicked participant must not be able to guess their way back in.
          recoveryCode: encodeCode(currentRoom?.recoveryCode || generateRecoveryCode())
        }
      });

      // 3. Notify the target user specifically
      io.to(`user_${targetUserId}`).emit("kicked-from-room");

      // 4. Force their socket(s) to leave the room channel, and the call
      const targetSockets = await io.in(`user_${targetUserId}`).fetchSockets();
      targetSockets.forEach(s => s.leave(roomId));
      dropAudioParticipant(roomId, targetUserId);

      // 5. Update the room's participant list for everyone else
      const room = await prisma.pairRoom.findUnique({
        where: { id: roomId },
        include: {
          participants: {
            include: { user: { select: { name: true, avatar_url: true } } }
          }
        }
      });

      if (room) {
        const participants = room.participants.map((p: any) => ({
          userId: p.userId,
          name: p.user.name,
          avatar_url: p.user.avatar_url,
          role: p.role
        }));
        io.to(roomId).emit("participant-update", participants);
        io.to(roomId).emit("kicked-update", { 
          kickedUserIds: room.kickedUserIds, 
          recoveryCode: room.recoveryCode 
        });
      }
    } catch (err) {
      console.error("Socket kick-participant error:", err);
    }
  });

  socket.on("host-leaving", async ({ roomId }: { roomId: string }) => {
    const meta = socketMetadata.get(socket.id);
    if (meta && meta.isHost) {
      socketDebug(`📢 Host explicitly closing room: ${roomId}`);
      await softDeleteRoom(roomId, meta.slug);
    }
  });

  socket.on("leave-room", async ({ roomId, userId }: { roomId: string, userId: string }) => {
    const meta = socketMetadata.get(socket.id);
    if (meta) {
      socketDebug(`👤 User ${userId} explicitly left room ${roomId}`);
      socket.leave(roomId);
      dropAudioParticipant(roomId, meta.userId);
      await handleParticipantLeave(roomId, userId, meta.slug);
    }
  });

  // --- Audio Signaling ---

  socket.on("join-audio", ({ roomId, userId }: { roomId: string, userId: string }) => {
    let call = roomAudioParticipants.get(roomId);
    if (!call) {
      call = new Set();
      roomAudioParticipants.set(roomId, call);
    }
    call.add(userId);

    socket.to(roomId).emit("user-joined-audio", { userId });
    io.to(roomId).emit("audio-participants-update", Array.from(call));
  });

  socket.on("audio-signal", ({ roomId, targetUserId, signal, fromUserId }: any) => {
    io.to(`user_${targetUserId}`).emit("audio-signal", { signal, fromUserId });
  });

  socket.on("leave-audio", ({ roomId, userId }: { roomId: string, userId: string }) => {
    dropAudioParticipant(roomId, userId);
  });

  socket.on("get-audio-participants", (roomId: string) => {
    socket.emit("audio-participants-update", Array.from(roomAudioParticipants.get(roomId) || []));
  });

  socket.on("disconnect", async () => {
    socketDebug(`🔌 Client disconnected: ${socket.id}`);
    const meta = socketMetadata.get(socket.id);
    if (meta) {
      // A dropped socket is off the call whether or not it said goodbye.
      dropAudioParticipant(meta.roomId, meta.userId);
      // Check if room should be closed
      await handleParticipantLeave(meta.roomId, meta.userId, meta.slug);
      socketMetadata.delete(socket.id);
    }
  });
});

/**
 * Hardening headers go on before anything else, so they are present on every
 * response including the ones the guard and the limiters reject.
 */
app.use(securityHeaders);

/**
 * Gzip/brotli for anything over a kilobyte. The catalogue payloads (problem
 * lists, aptitude pages, the dashboard) are JSON that shrinks five- to
 * ten-fold, and the SPA's host is a long way from Railway. Responses only —
 * the raw-body webhook below is a request body and is untouched by this.
 */
app.use(compression({ threshold: 1024 }));

/**
 * CORS goes ahead of the rate limiter so a preflight never spends a token:
 * `cors` answers OPTIONS itself, and a page that fires twenty requests would
 * otherwise count forty against the same address. `maxAge` lets the browser
 * keep the preflight answer for a day instead of asking before every call.
 */
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ALLOWED_HEADERS,
    maxAge: 86400,
  })
);

/** A ceiling for every caller, under which the per-route limits are stricter. */
app.use(generalLimiter);

/**
 * The payment webhook is signed over the exact bytes Cashfree sent, so it must
 * reach the route as a Buffer — `express.json()` would parse it, and the
 * re-serialised body would never reproduce the signature. Mounted before the
 * JSON parser so this one path wins; every other route is unaffected.
 */
app.use("/api/billing/webhook", express.raw({ type: "*/*", limit: "1mb" }));

// Strict Platform Guard
app.use(platformGuard);

// Above the 100kb default: a mock-test autosave carries every answer and code
// buffer of a sitting, and a bug-hunt submit carries a whole project's files.
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * Guessing a credential is the attack these limits exist for, so they are
 * mounted ahead of the auth routes rather than inside them. Asking for a code
 * is limited harder still, because it also sends mail in our name.
 *
 * `/session-token` is excluded: the SPA calls it on every load to read the
 * token behind its own cookie, and it grants nothing to a caller who does not
 * already hold that cookie.
 */
app.use(["/api/auth/login", "/api/auth/register", "/api/auth/verify-otp", "/api/auth/reset-password"], authLimiter);
app.use("/api/auth/forgot-password", otpRequestLimiter);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/auth", oauthRouter);
app.use("/api/me", meRouter);
app.use("/api/problems", problemsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/bug-challenges", bugChallengesRouter);
app.use("/api/pair-rooms", pairRoomsRouter);
// Voice paths are namespaced under /session/:id/voice, so this shares the
// written router's prefix without shadowing any of its routes.
app.use("/api/interviews", interviewsVoiceRouter);
app.use("/api/interviews", interviewsRouter);
app.use("/api/billing", billingRouter);
app.use("/api/campus", campusRouter);
app.use("/api/community", communityRouter);
app.use("/api/duels", duelsRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/aptitude", aptitudeRouter);
app.use("/api/tests", mockTestsRouter);
app.use("/api", executionRouter); 

// GET /api/username-check (Public, non-NextAuth)
app.get("/api/username-check", optionalAuth, async (req: any, res) => {
  const { username } = req.query;
 
  if (!username || typeof username !== "string") {
    res.status(400).json({ error: "Username is required." });
    return;
  }
 
  // 1. Format Validation
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    res.json({ available: false, error: "Invalid format" });
    return;
  }
 
  if (username.length < 3) {
    res.json({ available: false, error: "Too short" });
    return;
  }
 
  try {
    // 2. Uniqueness Check (Excluding self if logged in)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: { equals: username },
        // If logged in, exclude self
        id: req.user?.userId ? { not: req.user.userId } : undefined
      },
      select: { id: true },
    });
 
    if (existingUser) {
      res.json({ available: false, error: "Taken" });
    } else {
      res.json({ available: true });
    }
  } catch (err) {
    console.error("GET /api/username-check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
 
// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * The last word on any error no route handled.
 *
 * Express 5 forwards a rejected promise from any handler here automatically,
 * and its built-in handler answers 500 while printing nothing when NODE_ENV is
 * production. That is how `/voice/complete` could return 500 with no trace of
 * it in the Railway logs at all — the failure was real, the record of it was
 * not. Every unhandled error in the API had the same blind spot; this closes
 * it for all of them rather than for one route.
 *
 * The response body stays deliberately vague: the detail belongs in the log,
 * not in something a caller can read.
 */
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(
    `[unhandled] ${req.method} ${req.originalUrl}:`,
    JSON.stringify({
      name: err?.name,
      // Prisma puts its P-codes here, which separates a database failure from
      // anything else at a glance.
      code: err?.code,
      message: err?.message ?? String(err),
      stack: String(err?.stack ?? "").split("\n").slice(0, 6).join(" | "),
    }),
  );
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
});

/**
 * A rejection nobody awaited would otherwise take the process down silently
 * under Node's default, losing every in-flight interview with it.
 */
process.on("unhandledRejection", (reason: any) => {
  console.error("[unhandledRejection]", reason?.stack ?? reason?.message ?? String(reason));
});

httpServer.listen(PORT, () => {
  // Open the cache connection now so the first real request does not pay for it,
  // and start honouring invalidations published by other instances.
  void warmRedis();
  startCacheInvalidationListener();
  console.log(`🚀 Backend & WebSocket running on port: ${PORT}`);
  console.log(`   Auth:   POST /api/auth/login`);
  console.log(`   Me:     GET /api/me`);
  console.log(`   Problems: GET /api/problems`);
  console.log(`   Run:    POST /api/run`);
  console.log(`   Submit: POST /api/submit`);
  console.log(`   Leaderboard: GET /api/leaderboard`);
  console.log(`   Health: GET /health`);
});

/**
 * Drain on a deploy instead of dying mid-request.
 *
 * Railway sends SIGTERM and gives the old instance a moment before it is
 * killed. In that moment: stop accepting (the listener closes, idle keep-alive
 * connections with it), let in-flight responses finish, tell every socket the
 * server is going away, then release the database pool and the Redis
 * connections — the shared MySQL host counts each of the 25 slots, and a
 * connection that is simply abandoned holds its slot until wait_timeout.
 *
 * The fallback timer is unref()'d so it cannot itself keep the process alive
 * once everything else has wound down cleanly.
 */
let shuttingDown = false;
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} received, draining`);

  const fallback = setTimeout(() => {
    console.error("[shutdown] still busy after 10s, exiting anyway");
    process.exit(1);
  }, 10_000);
  fallback.unref();

  try {
    // io.close() disconnects every socket and closes the http server it is
    // attached to, resolving once existing requests have completed.
    await new Promise<void>((resolve) => void io.close(() => resolve()));
    await Promise.allSettled([prisma.$disconnect(), closeRedis()]);
    console.log("[shutdown] clean");
    process.exit(0);
  } catch (err) {
    console.error("[shutdown] error while draining:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
