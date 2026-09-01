import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { getHeatmap, getSubmissionHistory, getPairingHistory, getDifficultyStats, getRank, getDashboard } from "../services/dashboard.js";

const router = Router();

// GET /api/me/activity — stats for bar graph (DEPRECATED, using heatmap instead)
router.get("/activity", requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(today.getDate() - 9);
    tenDaysAgo.setHours(0, 0, 0, 0);

    const submissions = await prisma.submission.findMany({
      where: {
        userId: req.user!.userId,
        verdict: "ACCEPTED",
        submittedAt: {
          gte: tenDaysAgo,
          lte: today,
        },
      },
      select: {
        submittedAt: true,
      },
    });

    const counts: Record<string, number> = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = 0; i < 10; i++) {
        const d = new Date(tenDaysAgo);
        d.setDate(tenDaysAgo.getDate() + i);
        const label = `${days[d.getDay()]} ${d.getDate()}/${d.getUTCMonth() + 1}`;
        counts[label] = 0;
    }

    submissions.forEach((s) => {
      const d = new Date(s.submittedAt);
      const label = `${days[d.getDay()]} ${d.getDate()}/${d.getUTCMonth() + 1}`;
      if (counts[label] !== undefined) {
        counts[label]++;
      }
    });

    const result = Object.entries(counts).map(([day, count]) => ({
      day,
      solved: count,
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /api/me/activity error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/heatmap — Contribution data for the last 365 days
router.get("/heatmap", requireAuth, async (req, res) => {
  try {
    res.json(await getHeatmap(req.user!.userId));
  } catch (err) {
    console.error("GET /api/me/heatmap error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/username-check — verify availability
router.get("/username-check", requireAuth, async (req, res) => {
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
    // 2. Uniqueness Check (Excluding self)
    const existingUser = await prisma.user.findFirst({
      where: { 
        username: { equals: username, mode: 'insensitive' },
        id: { not: req.user!.userId }
      }
    });

    if (existingUser) {
      res.json({ available: false, error: "Taken" });
    } else {
      res.json({ available: true });
    }
  } catch (err) {
    console.error("GET /api/me/username-check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me — returns current authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    let user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        username: true,
        instituteName: true,
        email: true,
        avatar_url: true,
        gender: true,
        location: true,
        birthday: true,
        website: true,
        github: true,
        linkedin: true,
        twitter: true,
        readme: true,
        xp: true,
        questionsXp: true,
        bugsXp: true,
        rating: true,
        provider: true,
        createdAt: true,
        stats: {
          select: {
            problemsSolved: true,
            bugsFixed: true,
            currentStreak: true,
            longestStreak: true,
            lastActive: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.stats) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastActive = new Date(user.stats.lastActive);
      lastActive.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 1 && user.stats.currentStreak > 0) {
        await prisma.userStats.update({
          where: { userId: user.id },
          data: { currentStreak: 0 }
        });
        user.stats.currentStreak = 0;
      }
    }

    if (!user.username) {
      const baseName = user.name || "user";
      let newUsername = baseName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      if (newUsername.length < 3) newUsername = "user_" + Math.random().toString(36).substring(2, 7);
      
      // Check uniqueness and append suffix if needed
      const existing = await prisma.user.findFirst({ where: { username: newUsername } });
      if (existing) {
        newUsername += "_" + Math.random().toString(36).substring(2, 5);
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: { username: newUsername },
        select: {
          id: true,
          name: true,
          username: true,
          instituteName: true,
          email: true,
          avatar_url: true,
          gender: true,
          location: true,
          birthday: true,
          website: true,
          github: true,
          linkedin: true,
          twitter: true,
          readme: true,
          xp: true,
          questionsXp: true,
          bugsXp: true,
          rating: true,
          provider: true,
          createdAt: true,
          stats: {
            select: {
              problemsSolved: true,
              bugsFixed: true,
              currentStreak: true,
              longestStreak: true,
              lastActive: true,
            },
          },
        },
      });
    }

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const getTierTitle = (rating: number) => {
      if (rating < 1200) return "Novice";
      if (rating < 1500) return "Warrior";
      if (rating < 1800) return "Elite";
      if (rating < 2100) return "Master";
      return "Legend";
    };

    // Ranks are now fetched independently via /api/me/rank to optimize performance
    const globalRank = user.xp > 0 ? "..." : null; 

    // --- Trend Calculations (Ensuring only FIRST-TIME solves are counted) ---
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get all unique problems solved in the last 7 days
    const recentSolvedProblems = await prisma.submission.findMany({
      where: {
        userId: user.id,
        verdict: "ACCEPTED",
        submittedAt: { gte: last7Days }
      },
      select: {
        problemId: true,
        submittedAt: true,
        problem: { select: { difficulty: true } }
      },
      distinct: ['problemId'], // Get each problem once
    });

    let solvedToday = 0;
    let xpThisWeek = 0;
    const xpMap: Record<string, number> = { easy: 10, medium: 20, hard: 30 };

    for (const sub of recentSolvedProblems) {
      // Check if this was REALLY the first time they solved it
      const solveCountBefore = await prisma.submission.count({
        where: {
          userId: user.id,
          problemId: sub.problemId,
          verdict: "ACCEPTED",
          submittedAt: { lt: sub.submittedAt }
        }
      });

      if (solveCountBefore === 0) {
        // It's a brand new solve!
        xpThisWeek += xpMap[sub.problem.difficulty.toLowerCase()] ?? 10;
        if (sub.submittedAt >= last24Hours) {
          solvedToday++;
        }
      }
    }

    // 3. Bugs Fixed This Week
    const bugsFixedThisWeek = await prisma.bugSubmission.count({
      where: {
        userId: user.id,
        verdict: "ACCEPTED",
        submittedAt: { gte: last7Days }
      }
    });

    res.json({
      ...user,
      tierTitle: getTierTitle(user.rating),
      trends: {
        xpThisWeek,
        solvedToday,
        bugsFixedThisWeek
      }
    });
  } catch (err) {
    console.error("GET /api/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// PATCH /api/me — updates current user profile
router.patch("/", requireAuth, async (req, res) => {
  const { 
    username, instituteName, avatar_url, name, 
    gender, location, birthday, website, 
    github, linkedin, twitter, readme 
  } = req.body;

  // 1. Strict Username Validation (No spaces, no special characters)
  if (username !== undefined) {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (username.length > 0 && !usernameRegex.test(username)) {
      res.status(400).json({ error: "Username can only contain letters, numbers, and underscores." });
      return;
    }

    // 2. Explicit Uniqueness Check
    if (username.length > 0) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          username: { equals: username, mode: 'insensitive' },
          id: { not: req.user!.userId }
        }
      });
      if (existingUser) {
        res.status(400).json({ error: "Username is already taken." });
        return;
      }
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        username: username !== undefined ? username : undefined,
        instituteName: instituteName !== undefined ? instituteName : undefined,
        avatar_url: avatar_url !== undefined ? avatar_url : undefined,
        name: name !== undefined ? name : undefined,
        gender: gender !== undefined ? gender : undefined,
        location: location !== undefined ? location : undefined,
        birthday: birthday !== undefined ? (birthday && !isNaN(Date.parse(birthday)) ? new Date(birthday) : null) : undefined,
        website: website !== undefined ? website : undefined,
        github: github !== undefined ? github : undefined,
        linkedin: linkedin !== undefined ? linkedin : undefined,
        twitter: twitter !== undefined ? twitter : undefined,
        readme: readme !== undefined ? readme : undefined,
      },
    });

    res.json(updatedUser);
  } catch (err: any) {
    console.error("PATCH /api/me error:", err);
    if (err.code === "P2002") {
      res.status(400).json({ error: "Username already taken." });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/submissions — detailed history of all attempts
router.get("/submissions", requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    res.json(await getSubmissionHistory(req.user!.userId, page, limit));
  } catch (err) {
    console.error("GET /api/me/submissions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/pairing-history — returns sessions where the user was a participant (paginated)
router.get("/pairing-history", requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;
    res.json(await getPairingHistory(req.user!.userId, page, limit));
  } catch (err) {
    console.error("GET /api/me/pairing-history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/difficulty-stats — returns counts of solved, attempted, and total problems per difficulty
router.get("/difficulty-stats", requireAuth, async (req, res) => {
  try {
    res.json(await getDifficultyStats(req.user!.userId));
  } catch (err) {
    console.error("GET /api/me/difficulty-stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/rank?type=combined|questions|bugs
router.get("/rank", requireAuth, async (req, res) => {
  try {
    const { type = "combined" } = req.query;
    res.json(await getRank(req.user!.userId, String(type)));
  } catch (err) {
    console.error("GET /api/me/rank error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/dashboard — everything the dashboard home needs, in one round-trip
router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    res.json(await getDashboard(req.user!.userId));
  } catch (err) {
    console.error("GET /api/me/dashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
