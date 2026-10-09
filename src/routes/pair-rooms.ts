import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { kickedUserIdsOf, removeKickedUser } from "../lib/room-kicks.js";
import { decodeCode } from "../lib/obfuscation.js";
import { requireAuth } from "../middleware/auth.js";
import { emitToRoom, socketsInRoom } from "../lib/realtime.js";
import { cached } from "../lib/cache.js";
import { invalidateDashboard } from "../services/dashboard.js";
import { forgetLobby, LOBBY_KEY, LOBBY_WINDOW_MS, openPairRoom, PairRoomError, seatInRoom } from "../services/pair-rooms.js";

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

/** The most rooms the lobby lists at once. */
const LOBBY_TAKE = 50;

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
  const { count } = await prisma.pairRoom.updateMany({
    where: { id: room.id, status: { not: "closed" } },
    data: { status: "closed", endedAt },
  });
  if (count > 0) await afterRoomClosed(room.id);
  return { ...room, status: "closed", endedAt };
}

/** The lobby's shared copy and its rules live with the create path (services/pair-rooms.ts). */
const LOBBY_TTL_MS = 3_000;

/**
 * After a room closes, by whichever path (the socket layer's grace timer in
 * index.ts, or a read finding it abandoned here): it leaves the lobby, and
 * it joins each participant's pairing history — the dashboard's `pairing`
 * slice, otherwise stale for the dashboard's five-minute TTL. Never throws:
 * the room is closed either way, and a cache left to its TTL is no reason to
 * fail the request that closed it.
 */
export async function afterRoomClosed(roomId: string): Promise<void> {
  forgetLobby();
  try {
    const people = await prisma.roomParticipant.findMany({ where: { roomId }, select: { userId: true } });
    for (const p of people) invalidateDashboard(p.userId);
  } catch (err) {
    console.error("pair room close: could not refresh participants' dashboards:", err);
  }
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
    const rooms = await cached(LOBBY_KEY, LOBBY_TTL_MS, async () => {
      const rows = await prisma.pairRoom.findMany({
        // A cohort's session room is for its members (services/cohorts.ts):
        // it is never advertised to strangers.
        where: { status: "waiting", startedAt: { gte: new Date(Date.now() - LOBBY_WINDOW_MS) }, cohortSession: { is: null } },
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
      return rows.map(({ _count, ...room }) => ({ ...room, participantCount: _count.participants }));
    });

    res.json(rooms);
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
  try {
    const room = await openPairRoom(userId, {
      problemId,
      mode,
      seats: maxParticipants as number,
      include: { problem: { select: ROOM_PROBLEM_SELECT } },
    });
    res.status(201).json(room);
  } catch (err) {
    if (err instanceof PairRoomError) return res.status(err.status).json({ error: err.message });
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

    // Check if user was kicked (kickedUserIds is a Json array on MySQL).
    // Read through the helper: a row written by the old push path holds an
    // object, and treating that as an array threw on every join.
    const isKicked = kickedUserIdsOf(room.kickedUserIds).includes(userId);

    // If kicked, they MUST provide the recoveryCode correctly
    if (isKicked) {
      const storedRecovery = decodeCode(room.recoveryCode);
      if (!passcode || passcode.toUpperCase() !== storedRecovery) {
        return res.status(403).json({
          error: "KICKED_RECOVERY_REQUIRED",
          message: "You have been removed from this room. Please enter the recovery passcode provided by the host to re-join."
        });
      }

      // If recovery code is correct, remove from kicked list. One atomic
      // statement rather than writing back a filtered copy of a snapshot —
      // that copy was taken several round trips earlier, so a kick landing in
      // the meantime was silently undone.
      await removeKickedUser(id, userId);
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
       // The snapshot above is only a courtesy: it can be stale by the time
       // the seat is taken, so the capacity rule is enforced by the database
       // in the same statement that inserts the row (lib/seat-claim.ts).
       //
       // This used to be a Serializable interactive transaction — BEGIN, a
       // count, an insert, COMMIT — which held locks across four round trips
       // and, being Serializable, could deadlock into a 500 that the catch
       // below did not recognise. One conditional INSERT enforces exactly the
       // same invariant, holds nothing between statements, and reports "full"
       // as a value rather than a thrown error. A re-join is a duplicate on
       // the existing unique and stays an idempotent success.
       const claim = await seatInRoom(id, userId, room.maxParticipants);
       if (claim === "full") {
         return res.status(403).json({ error: "Room is full" });
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
    // Delete first, with the ownership in the WHERE, and only ask why when
    // nothing was deleted. The host's own delete — every successful one — is
    // then a single round trip instead of a read and a write, while a refusal
    // still costs exactly what it did and still tells 404 and 403 apart. It
    // also closes the gap between the check and the delete: ownership is now
    // decided by the same statement that acts on it.
    const { count } = await prisma.pairRoom.deleteMany({ where: { id, createdBy: userId } });

    if (count === 0) {
      const room = await prisma.pairRoom.findUnique({ where: { id }, select: { createdBy: true } });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      return res.status(403).json({ error: "Unauthorized to delete this room" });
    }
    // Anyone still sitting in it is told, the same way a soft close tells
    // them; the row is gone, so their next request would only 404.
    emitToRoom(id, "room-ended", { slug: null });
    forgetLobby();

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/pair-rooms/:id error:", err);
    res.status(500).json({ error: "Failed to delete room" });
  }
});

export default router;
