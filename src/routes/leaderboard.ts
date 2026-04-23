import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/leaderboard — Return top 10 users by metric
router.get("/", async (req, res) => {
  const { type = "combined" } = req.query;

  let orderBy: any = { xp: "desc" };
  if (type === "questions") orderBy = { questionsXp: "desc" };
  if (type === "bugs") orderBy = { bugsXp: "desc" };

  try {
    const [topUsers, totalUsers] = await Promise.all([
      prisma.user.findMany({
        orderBy,
        take: 10,
        select: {
          id: true,
          name: true,
          username: true,
          avatar_url: true,
          xp: true,
          questionsXp: true,
          bugsXp: true,
          stats: {
            select: {
              problemsSolved: true,
              bugsFixed: true,
            },
          },
        },
      }),
      prisma.user.count()
    ]);

    const result = topUsers.map((u) => {
      let hasValue = false;
      if (type === "combined") hasValue = u.xp > 0;
      else if (type === "questions") hasValue = u.questionsXp > 0;
      else if (type === "bugs") hasValue = u.bugsXp > 0;

      return {
        id: u.id,
        name: u.name || "Anonymous User",
        username: u.username || u.name || "Anonymous",
        avatar: u.avatar_url,
        xp: u.xp,
        questionsXp: u.questionsXp,
        bugsXp: u.bugsXp,
        problemsSolved: u.stats?.problemsSolved || 0,
        bugsFixed: u.stats?.bugsFixed || 0,
        hasValue
      };
    });

    res.json({ rankings: result, totalUsers });
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
