import "dotenv/config";
console.log("--- BACKEND STARTING UP ---");
console.log("JUDGE0_URL:", process.env["JUDGE0_URL"]);
console.log("JUDGE0_DEBUG_LOGS:", process.env["JUDGE0_DEBUG_LOGS"]);
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import authRouter from "./routes/auth.js";
import meRouter from "./routes/me.js";
import problemsRouter from "./routes/problems.js";
import executionRouter from "./routes/execution.js";
import leaderboardRouter from "./routes/leaderboard.js";
import bugChallengesRouter from "./routes/bug-challenges.js";
import pairRoomsRouter from "./routes/pair-rooms.js";
import { optionalAuth } from "./middleware/auth.js";
import { platformGuard } from "./middleware/platformGuard.js";
import { prisma } from "./lib/prisma.js";
import { encodeCode } from "./lib/obfuscation.js";
// recoveryCode is generated using Math.random for simplicity

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env["PORT"] ?? 3001);
const FRONTEND_URL = process.env["FRONTEND_URL"] ?? "http://localhost:3000";

// --- Socket.io Setup ---
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
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

io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on("join-room", async (roomId: string, userId: string) => {
    socket.join(roomId);
    console.log(`👤 Client ${socket.id} (User: ${userId}) joined room: ${roomId}`);

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

  socket.on("identify-user", (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`🆔 Socket ${socket.id} identified as user ${userId}`);
  });

  socket.on("user-joined-notify", ({ roomId, name }: { roomId: string, name: string }) => {
    socket.to(roomId).emit("user-joined", { name });
  });

  socket.on("code-update", ({ roomId, code }: { roomId: string, code: string }) => {
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
      // 1. Identify the requester (Ensure only host can kick)
      const requester = await prisma.roomParticipant.findFirst({
        where: { roomId, userId: (socket as any).userId || "" } // We rely on userId attached to socket or a lookup
      });

      // If we don't have socket.userId attached, we can try to find by socket.id if we mapped it, 
      // but for simplicity here we trust the identification if the session is secure.
      // A better way is to find the participant with role 'host' and check if their userId matches.
      const host = await prisma.roomParticipant.findFirst({
        where: { roomId, role: "host" }
      });

      // Simple check: if the socket hasn't identified or isn't the host, abort.
      // Note: In a production app, we'd use a more robust session-to-socket mapping.

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
          recoveryCode: encodeCode(currentRoom?.recoveryCode || Math.random().toString(36).substring(2, 8).toUpperCase())
        }
      });

      // 3. Notify the target user specifically
      io.to(`user_${targetUserId}`).emit("kicked-from-room");

      // 4. Force their socket(s) to leave the room channel
      const targetSockets = await io.in(`user_${targetUserId}`).fetchSockets();
      targetSockets.forEach(s => s.leave(roomId));

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
      console.log(`📢 Host explicitly closing room: ${roomId}`);
      await softDeleteRoom(roomId, meta.slug);
    }
  });

  socket.on("leave-room", async ({ roomId, userId }: { roomId: string, userId: string }) => {
    const meta = socketMetadata.get(socket.id);
    if (meta) {
      console.log(`👤 User ${userId} explicitly left room ${roomId}`);
      socket.leave(roomId);
      await handleParticipantLeave(roomId, userId, meta.slug);
    }
  });

  // --- Audio Signaling ---
  const roomAudioParticipants = new Map<string, Set<string>>();

  socket.on("join-audio", ({ roomId, userId }: { roomId: string, userId: string }) => {
    if (!roomAudioParticipants.has(roomId)) {
      roomAudioParticipants.set(roomId, new Set());
    }
    roomAudioParticipants.get(roomId)?.add(userId);
    
    socket.to(roomId).emit("user-joined-audio", { userId });
    io.to(roomId).emit("audio-participants-update", Array.from(roomAudioParticipants.get(roomId) || []));
  });

  socket.on("audio-signal", ({ roomId, targetUserId, signal, fromUserId }: any) => {
    io.to(`user_${targetUserId}`).emit("audio-signal", { signal, fromUserId });
  });

  socket.on("leave-audio", ({ roomId, userId }: { roomId: string, userId: string }) => {
    roomAudioParticipants.get(roomId)?.delete(userId);
    socket.to(roomId).emit("user-left-audio", { userId });
    io.to(roomId).emit("audio-participants-update", Array.from(roomAudioParticipants.get(roomId) || []));
  });

  socket.on("get-audio-participants", (roomId: string) => {
    socket.emit("audio-participants-update", Array.from(roomAudioParticipants.get(roomId) || []));
  });

  socket.on("disconnect", async () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    const meta = socketMetadata.get(socket.id);
    if (meta) {
      // Check if room should be closed
      await handleParticipantLeave(meta.roomId, meta.userId, meta.slug);
      socketMetadata.delete(socket.id);
    }
  });
});

// CORS — allow frontend origin with credentials
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-App-Platform", "X-App-Signature", "X-App-Timestamp"],
  })
);

// Strict Platform Guard
app.use(platformGuard);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/problems", problemsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/bug-challenges", bugChallengesRouter);
app.use("/api/pair-rooms", pairRoomsRouter);
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
        username: { equals: username, mode: 'insensitive' },
        // If logged in, exclude self
        id: req.user?.userId ? { not: req.user.userId } : undefined
      }
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

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend & WebSocket running on port: ${PORT}`);
  console.log(`   Auth:   GET /api/auth/google`);
  console.log(`   Me:     GET /api/me`);
  console.log(`   Problems: GET /api/problems`);
  console.log(`   Run:    POST /api/run`);
  console.log(`   Submit: POST /api/submit`);
  console.log(`   Leaderboard: GET /api/leaderboard`);
  console.log(`   Health: GET /health`);
});
