import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/bug-challenges — List all published bug hunts
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { difficulty, category } = req.query;

    const where: any = {
      isPublished: true,
    };

    if (difficulty) where.difficulty = difficulty as string;
    if (category) where.category = category as string;

    const challenges = await prisma.bugChallenge.findMany({
      where,
      select: {
        id: true,
        title: true,
        difficulty: true,
        category: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(challenges);
  } catch (err) {
    console.error("GET /api/bug-challenges error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
