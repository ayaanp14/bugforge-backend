import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

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
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const oneYearAgo = new Date();
    oneYearAgo.setDate(today.getDate() - 364);
    oneYearAgo.setHours(0, 0, 0, 0);

    const submissions = await prisma.submission.findMany({
      where: {
        userId: req.user!.userId,
        verdict: "ACCEPTED",
        submittedAt: {
          gte: oneYearAgo,
          lte: today,
        },
      },
      select: {
        submittedAt: true,
      },
    });

    const dailyCounts: Record<string, number> = {};
    
    // Aggregrate counts
    submissions.forEach((s) => {
      const dateStr = s.submittedAt.toISOString().split('T')[0];
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    });

    // Calculate streaks and active days
    const dates: string[] = [];
    for (let i = 0; i < 365; i++) {
        const d = new Date(oneYearAgo);
        d.setDate(oneYearAgo.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    let maxStreak = 0;
    let currentStreakCount = 0;
    let activeDays = 0;

    dates.forEach(date => {
        if (dailyCounts[date]) {
            activeDays++;
            currentStreakCount++;
            if (currentStreakCount > maxStreak) maxStreak = currentStreakCount;
        } else {
            currentStreakCount = 0;
        }
    });

    // Final formatting for the heatmap component
    const heatmapData = dates.map(date => ({
        date,
        count: dailyCounts[date] || 0
    }));

    res.json({
        totalSubmissions: submissions.length,
        activeDays,
        maxStreak,
        currentStreak: currentStreakCount,
        heatmapData
    });
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
    const skip = (page - 1) * limit;

    const [problemSubmissions, bugSubmissions] = await Promise.all([
      prisma.submission.findMany({
        where: { userId: req.user!.userId },
        include: { problem: { select: { title: true, difficulty: true } } },
        orderBy: { submittedAt: "desc" },
      }),
      prisma.bugSubmission.findMany({
        where: { userId: req.user!.userId },
        include: { challenge: { select: { title: true, difficulty: true } } },
        orderBy: { submittedAt: "desc" },
      })
    ]);

    // Normalize and combine
    const history = [
      ...problemSubmissions.map(s => ({
        id: s.id,
        type: "problem",
        title: s.problem.title,
        difficulty: s.problem.difficulty,
        verdict: s.verdict,
        language: s.language,
        runtime: s.runtimeMs ? `${s.runtimeMs}ms` : "N/A",
        memory: s.memoryKb ? `${(s.memoryKb / 1024).toFixed(2)}MB` : "N/A",
        code: s.code,
        submittedAt: s.submittedAt
      })),
      ...bugSubmissions.map(s => ({
        id: s.id,
        type: "bug",
        title: s.challenge.title,
        difficulty: s.challenge.difficulty,
        verdict: s.verdict,
        language: "JS/JSON",
        runtime: s.timeTakenSecs ? `${s.timeTakenSecs}s` : "N/A",
        memory: "N/A",
        code: JSON.stringify(s.editedFiles, null, 2),
        submittedAt: s.submittedAt
      }))
    ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    const paginatedHistory = history.slice(skip, skip + limit);

    res.json({
      history: paginatedHistory,
      total: history.length,
      page,
      limit
    });
  } catch (err) {
    console.error("GET /api/me/submissions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/pairing-history — returns sessions where the user was a participant (paginated)
router.get("/pairing-history", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.pairRoom.findMany({
        where: {
          status: "closed",
          participants: {
            some: { userId: userId }
          }
        },
        select: {
          id: true,
          endedAt: true,
          problem: {
            select: { title: true, difficulty: true }
          },
          participants: {
            select: {
              userId: true,
              user: { select: { name: true, avatar_url: true } }
            }
          },
          submissions: {
            select: {
              verdict: true,
              code: true,
              language: true,
              submittedAt: true
            },
            orderBy: { submittedAt: "desc" },
            take: 1
          }
        },
        orderBy: { endedAt: "desc" },
        skip,
        take: limit
      }),
      prisma.pairRoom.count({
        where: {
          status: "closed",
          participants: {
            some: { userId: userId }
          }
        }
      })
    ]);

    res.json({ history, total });
  } catch (err) {
    console.error("GET /api/me/pairing-history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/difficulty-stats — returns counts of solved, attempted, and total problems per difficulty
router.get("/difficulty-stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // 1. Get total problems per difficulty
    const totalProblems = await prisma.problem.groupBy({
      by: ['difficulty'],
      where: { isPublished: true },
      _count: { _all: true }
    });

    const totalMap: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
    totalProblems.forEach(group => {
      totalMap[group.difficulty.toLowerCase()] = group._count._all;
    });

    // 2. Get unique problem interactions (solved or attempted)
    // We fetch all unique problemId's the user has submitted code for
    const userSubmissions = await prisma.submission.findMany({
      where: {
        userId,
        problem: { isPublished: true }
      },
      select: {
        problemId: true,
        verdict: true,
        problem: { select: { difficulty: true } }
      }
    });

    // Strategy: track best verdict per unique problem
    const problemBestVerdict: Record<string, { difficulty: string, isSolved: boolean }> = {};
    userSubmissions.forEach(sub => {
      const existing = problemBestVerdict[sub.problemId];
      const isAccepted = sub.verdict === "ACCEPTED";
      
      if (!existing) {
        problemBestVerdict[sub.problemId] = { 
          difficulty: sub.problem.difficulty.toLowerCase(), 
          isSolved: isAccepted 
        };
      } else if (isAccepted) {
        existing.isSolved = true;
      }
    });

    const solvedMap: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
    const attemptedMap: Record<string, number> = { easy: 0, medium: 0, hard: 0 };

    Object.values(problemBestVerdict).forEach(p => {
      if (p.isSolved) {
        solvedMap[p.difficulty]++;
      } else {
        attemptedMap[p.difficulty]++;
      }
    });

    res.json({
      easy: { solved: solvedMap.easy, attempted: attemptedMap.easy, total: totalMap.easy },
      medium: { solved: solvedMap.medium, attempted: attemptedMap.medium, total: totalMap.medium },
      hard: { solved: solvedMap.hard, attempted: attemptedMap.hard, total: totalMap.hard }
    });
  } catch (err) {
    console.error("GET /api/me/difficulty-stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/rank?type=combined|questions|bugs
router.get("/rank", requireAuth, async (req, res) => {
  try {
    const { type = "combined" } = req.query;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, questionsXp: true, bugsXp: true }
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let rank = null;
    if (type === "questions") {
      rank = user.questionsXp > 0 ? (await prisma.user.count({ where: { questionsXp: { gt: user.questionsXp } } }) + 1) : null;
    } else if (type === "bugs") {
      rank = user.bugsXp > 0 ? (await prisma.user.count({ where: { bugsXp: { gt: user.bugsXp } } }) + 1) : null;
    } else {
      rank = user.xp > 0 ? (await prisma.user.count({ where: { xp: { gt: user.xp } } }) + 1) : null;
    }

    res.json({ rank });
  } catch (err) {
    console.error("GET /api/me/rank error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
