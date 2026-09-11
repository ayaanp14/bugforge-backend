import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { encodeCode, decodeCode } from "../lib/obfuscation.js";
import { generateInviteCode } from "../lib/room-codes.js";
import { requireAuth } from "../middleware/auth.js";
import { emitToRoom, socketsInRoom } from "../lib/realtime.js";

const router = Router();

/**
 * The problem as a pair room embeds it: the same slice the workspace gets from
 * GET /api/problems/:slug. Never the answer key (`referenceSolution`,
 * `referenceLanguage`), and not the editorial or its solutions either — those
 * are the two heaviest columns on the row and nothing in a room reads them.
 */
const ROOM_PROBLEM_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  difficulty: true,
  tags: true,
  timeLimitMs: true,
  memoryLimitMb: true,
  isPublished: true,
  createdAt: true,
  starterCode: true,
  signature: true,
  hints: true,
  testCases: {
    where: { isHidden: false },
    orderBy: { orderIndex: "asc" },
  },
} as const;

/** How long a room can sit unopened before the lobby stops advertising it. */
const LOBBY_WINDOW_MS = 24 * 60 * 60 * 1000;

/** The most rooms the lobby lists at once. */
const LOBBY_TAKE = 50;

/** Waiting rooms one account may have open at a time. */
const MAX_WAITING_ROOMS_PER_USER = 3;

/**
 * How long a room may sit with nobody connected before a read closes it.
 *
 * The socket layer closes a room twenty seconds after its last socket
 * leaves — but that timer lives in the process, so a restart with rooms
 * mid-grace left them "active" for good, and a room whose sockets never
 * arrived (the host created it and closed the tab) was never closed at all.
 * Lazily, on read, in the same spirit as duels: nobody looks, nobody minds;
 * the moment somebody does, a room that has been empty for this long is over.
 */
const EMPTY_ROOM_TTL_MS = 60 * 60 * 1000;

async function closeIfAbandoned<T extends { id: string; status: string; startedAt: Date | null; endedAt: Date | null }>(room: T): Promise<T> {
  if (room.status === "closed") return room;
  const since = room.startedAt?.getTime() ?? 0;
  if (Date.now() - since < EMPTY_ROOM_TTL_MS) return room;
  if ((await socketsInRoom(room.id)) > 0) return room;
  const endedAt = new Date();
  await prisma.pairRoom.updateMany({
    where: { id: room.id, status: { not: "closed" } },
    data: { status: "closed", endedAt },
  });
  return { ...room, status: "closed", endedAt };
}

// GET /api/pair-rooms — List active pair programming rooms
router.get("/", requireAuth, async (_req, res) => {
  try {
    // A host who created a room and never opened the socket leaves it "waiting"
    // forever; this list used to grow by every one of them. `startedAt` is set
    // at creation (below) and again when the session actually starts, so a
    // day-old waiting room is one nobody is coming back to.
    //
    // Selected, not spread: the whole row carried `inviteCode` and
    // `recoveryCode` to anyone who asked (and the route was open to anyone),
    // and the "obfuscation" on them is a base64 prefix — so every private
    // room's passcode was one lobby request away.
    const rooms = await prisma.pairRoom.findMany({
      where: { status: "waiting", startedAt: { gte: new Date(Date.now() - LOBBY_WINDOW_MS) } },
      select: {
        id: true,
        mode: true,
        status: true,
        maxParticipants: true,
        startedAt: true,
        createdBy: true,
        problemId: true,
        creator: {
          select: { id: true, name: true, avatar_url: true }
        },
        problem: {
          select: { title: true, difficulty: true }
        },
        _count: { select: { participants: true } },
      },
      orderBy: { startedAt: "desc" },
      take: LOBBY_TAKE,
    });

    res.json(rooms.map(({ _count, ...room }) => ({ ...room, participantCount: _count.participants })));
  } catch (err) {
    console.error("GET /api/pair-rooms error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/pair-rooms — Create a new pair programming room
router.post("/", requireAuth, async (req, res) => {
  const { problemId, mode, maxParticipants } = req.body;
  const userId = (req as any).user.userId;

  if (typeof problemId !== "string" || !problemId || (mode !== "private" && mode !== "collaborative")) {
    return res.status(400).json({ error: "Missing problemId or mode" });
  }
  // Two to four seats. A room with zero (or a thousand) seats used to be
  // accepted as typed.
  const seats = Number.isInteger(maxParticipants) ? Math.min(4, Math.max(2, maxParticipants as number)) : 2;

  try {
    const problem = await prisma.problem.findFirst({ where: { id: problemId, isPublished: true }, select: { id: true } });
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    // A person opens a room and waits in it; they do not need five. Nothing
    // capped it, and every unopened one sat in the lobby for a day.
    const waiting = await prisma.pairRoom.count({
      where: { createdBy: userId, status: "waiting", startedAt: { gte: new Date(Date.now() - LOBBY_WINDOW_MS) } },
    });
    if (waiting >= MAX_WAITING_ROOMS_PER_USER) {
      return res.status(409).json({
        error: `You already have ${waiting} rooms waiting for a partner. Join one of those, or close them, before opening another.`,
      });
    }

    // Only generate inviteCode for private rooms. The code is the only thing
    // gating entry, so it comes from the cryptographic generator.
    const rawInviteCode = mode === "private" ? generateInviteCode() : null;

    const inviteCode = encodeCode(rawInviteCode);

    const room = await prisma.pairRoom.create({
      data: {
        problemId,
        mode,
        maxParticipants: seats,
        createdBy: userId,
        inviteCode,
        status: "waiting",
        // The row has no createdAt; this is what the lobby ages rooms by until
        // a guest arrives and the join below restamps it as the real start.
        startedAt: new Date(),
        participants: {
          create: {
            userId,
            role: "host"
          }
        }
      },
      include: {
        problem: { select: ROOM_PROBLEM_SELECT }
      }
    });

    res.status(201).json(room);
  } catch (err) {
    console.error("POST /api/pair-rooms error:", err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// GET /api/pair-rooms/:id — Get details of a specific room
router.get("/:id", requireAuth, async (req, res) => {
  const id = req.params.id as string;

  try {
    const found = await prisma.pairRoom.findUnique({
      where: { id },
      include: {
        creator: {
          select: { name: true, avatar_url: true }
        },
        problem: { select: ROOM_PROBLEM_SELECT },
        participants: {
          include: {
            user: {
              select: { name: true, avatar_url: true, username: true }
            }
          }
        }
      }
    });

    if (!found) {
      return res.status(404).json({ error: "Room not found" });
    }
    const room = await closeIfAbandoned(found);

    // Security: only expose the codes to the host/creator. The invite code
    // used to ride along for everyone — a guest could read it out of the
    // payload and hand a private room to anyone.
    const userId = (req as any).user.userId;
    const isHost = room.createdBy === userId;

    const responseData = {
      ...room,
      inviteCode: isHost ? room.inviteCode : null,
      recoveryCode: isHost ? room.recoveryCode : null
    };

    res.json(responseData);
  } catch (err) {
    console.error("GET /api/pair-rooms/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/pair-rooms/:id/join — Join a room using a passcode
router.post("/:id/join", requireAuth, async (req, res) => {
  const id = req.params.id as string;
  const { passcode } = req.body;
  const userId = (req as any).user.userId;

  try {
    const room = await prisma.pairRoom.findUnique({
      where: { id },
      include: {
        participants: true
      }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    // A closed room stays closed. Joining one by URL used to seat the caller
    // and, if they were the second person, flip it back to "active".
    if ((await closeIfAbandoned(room)).status === "closed") {
      return res.status(410).json({ error: "This room has ended" });
    }

    // Check if user was kicked (kickedUserIds is a Json array on MySQL)
    const kickedIds = (room.kickedUserIds as string[] | null) ?? [];
    const isKicked = kickedIds.includes(userId);

    // If kicked, they MUST provide the recoveryCode correctly
    if (isKicked) {
      const storedRecovery = decodeCode(room.recoveryCode);
      if (!passcode || passcode.toUpperCase() !== storedRecovery) {
        return res.status(403).json({
          error: "KICKED_RECOVERY_REQUIRED",
          message: "You have been removed from this room. Please enter the recovery passcode provided by the host to re-join."
        });
      }

      // If recovery code is correct, remove from kicked list
      await prisma.pairRoom.update({
        where: { id },
        data: {
          kickedUserIds: kickedIds.filter((uid) => uid !== userId)
        }
      });
    }

    // Skip passcode check for collaborative rooms
    if (room.mode === "collaborative") {
      // Proceed to join
    } else {
      if (!passcode) {
        return res.status(400).json({ error: "Passcode is required for private rooms" });
      }
      const storedCode = decodeCode(room.inviteCode);
      if (storedCode !== passcode.toUpperCase()) {
        return res.status(403).json({ error: "Invalid passcode" });
      }
    }

    // Check if user is already a participant
    const existing = room.participants.find(p => p.userId === userId);
    if (!existing) {
       // Check if room is full
       if (room.participants.length >= room.maxParticipants) {
         return res.status(403).json({ error: "Room is full" });
       }

       // The seat is taken inside a transaction that re-counts: two joins
       // racing for the last seat both passed the check above and both sat
       // down. Serializable so the two counts cannot interleave.
       try {
         await prisma.$transaction(async (tx) => {
           const seated = await tx.roomParticipant.count({ where: { roomId: id } });
           if (seated >= room.maxParticipants) throw new Error("ROOM_FULL");
           await tx.roomParticipant.create({
             data: {
               roomId: id,
               userId,
               role: "guest"
             }
           });
         }, { isolationLevel: "Serializable" });
       } catch (e) {
         if ((e as Error).message === "ROOM_FULL") {
           return res.status(403).json({ error: "Room is full" });
         }
         // Unique (roomId, userId) violation — a concurrent join request
         // already added this user; treat as an idempotent success.
         if ((e as { code?: string }).code !== "P2002") throw e;
       }

       // Update status if needed
       if (room.participants.length === 1) {
          await prisma.pairRoom.update({
            where: { id },
            data: { status: "active", startedAt: new Date() }
          });
       }
    }

    res.json({ message: "Joined successfully" });
  } catch (err) {
    console.error("POST /api/pair-rooms/:id/join error:", err);
    res.status(500).json({ error: "Failed to join room" });
  }
});

// DELETE /api/pair-rooms/:id — Delete a room (Host only)
router.delete("/:id", requireAuth, async (req, res) => {
  const id = req.params.id as string;
  const userId = (req as any).user.userId;

  try {
    const room = await prisma.pairRoom.findUnique({
      where: { id }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.createdBy !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this room" });
    }

    await prisma.pairRoom.delete({
      where: { id }
    });
    // Anyone still sitting in it is told, the same way a soft close tells
    // them; the row is gone, so their next request would only 404.
    emitToRoom(id, "room-ended", { slug: null });

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/pair-rooms/:id error:", err);
    res.status(500).json({ error: "Failed to delete room" });
  }
});

export default router;
