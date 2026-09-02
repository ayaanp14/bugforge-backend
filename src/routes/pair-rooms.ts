import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { encodeCode, decodeCode } from "../lib/obfuscation.js";
import { requireAuth } from "../middleware/auth.js";
import { banStore } from "../lib/banStore.js";

const router = Router();

// GET /api/pair-rooms — List active pair programming rooms
router.get("/", async (_req, res) => {
  try {
    const rooms = await prisma.pairRoom.findMany({
      where: { status: "waiting" },
      include: {
        creator: {
          select: { id: true, name: true, avatar_url: true }
        },
        problem: {
          select: { title: true, difficulty: true }
        }
      },
      orderBy: { startedAt: "desc" }
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

  if (!problemId || !mode) {
    return res.status(400).json({ error: "Missing problemId or mode" });
  }

  try {
    // Only generate inviteCode for private rooms
    const rawInviteCode = mode === "private" 
      ? Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase()
      : null;
    
    const inviteCode = encodeCode(rawInviteCode);
    
    const room = await prisma.pairRoom.create({
      data: {
        problemId,
        mode,
        maxParticipants: (typeof maxParticipants === "number" ? maxParticipants : 2),
        createdBy: userId,
        inviteCode,
        status: "waiting",
        participants: {
          create: {
            userId,
            role: "host"
          }
        }
      },
      include: {
        problem: {
          include: { 
            testCases: {
              where: { isHidden: false },
              orderBy: { orderIndex: "asc" }
            } 
          }
        }
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
    const room = await prisma.pairRoom.findUnique({
      where: { id },
      include: {
        creator: {
          select: { name: true, avatar_url: true }
        },
        problem: {
          include: { 
            testCases: {
              where: { isHidden: false },
              orderBy: { orderIndex: "asc" }
            } 
          }
        },
        participants: {
          include: {
            user: {
              select: { name: true, avatar_url: true, username: true }
            }
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Security: only expose recoveryCode to the host/creator
    const userId = (req as any).user.userId;
    const isHost = room.createdBy === userId;
    
    const responseData = {
      ...room,
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

       await prisma.roomParticipant.create({
         data: {
           roomId: id,
           userId,
           role: "guest"
         }
       });

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

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/pair-rooms/:id error:", err);
    res.status(500).json({ error: "Failed to delete room" });
  }
});

export default router;
