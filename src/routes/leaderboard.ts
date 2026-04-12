import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/leaderboard — Return top 10 users by XP
router.get("/", async (_req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { xp: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        username: true,
        avatar_url: true,
        xp: true,
        stats: {
          select: {
            problemsSolved: true,
          },
        },
      },
    });

    const result = topUsers.map((u: any) => ({
      id: u.id,
      name: u.name || "Anonymous User",
      username: u.username || u.name || "Anonymous",
      avatar: u.avatar_url,
      xp: u.xp,
      problemsSolved: u.stats?.problemsSolved || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
