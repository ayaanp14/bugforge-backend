import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { getHeatmap, getSubmissionHistory, getPairingHistory, getDifficultyStats, getRank, getDashboard } from "../services/dashboard.js";
import { ensureBaseline, listNotifications, countUnread, markAllRead } from "../services/notifications.js";
import { getMePayload, invalidateMe } from "../services/me.js";

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
        username: { equals: username },
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
    const userId = req.user!.userId;

    // The profile row and trends are cached (they change only on submissions and
    // profile edits). The unread badge is NOT: it has to be right the moment a
    // notification lands, so it is read live, in parallel with the cache lookup.
    const [payload, unreadNotifications] = await Promise.all([
      getMePayload(userId),
      // Fail-soft: a notification-subsystem problem must never break /api/me,
      // since the whole app treats a failed /api/me as "not logged in".
      countUnread(userId).catch((err) => {
        console.error("GET /api/me countUnread error:", err);
        return 0;
      }),
    ]);

    if (!payload) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ ...payload, unreadNotifications });
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
          username: { equals: username },
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

    // The profile just changed — drop the cached /api/me so the next read
    // reflects it instead of serving the pre-edit copy for the TTL.
    invalidateMe(req.user!.userId);

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

// GET /api/me/submissions/:id?type=problem|bug — the code of ONE submission,
// fetched on demand when a history row is opened (rows themselves are slim).
router.get("/submissions/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    if (req.query.type === "bug") {
      const sub = await prisma.bugSubmission.findFirst({ where: { id, userId }, select: { editedFiles: true } });
      if (!sub) {
        res.status(404).json({ error: "Submission not found" });
        return;
      }
      res.json({ code: JSON.stringify(sub.editedFiles, null, 2), language: "json" });
      return;
    }
    const sub = await prisma.submission.findFirst({ where: { id, userId }, select: { code: true, language: true } });
    if (!sub) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }
    res.json({ code: sub.code, language: sub.language });
  } catch (err) {
    console.error("GET /api/me/submissions/:id error:", err);
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

// GET /api/me/notifications — the bell dropdown payload
router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    // Backfill welcome/first-solve for accounts that predate notifications
    await ensureBaseline(userId);
    const [notifications, unreadCount] = await Promise.all([
      listNotifications(userId),
      countUnread(userId),
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error("GET /api/me/notifications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/me/notifications/read — mark everything read
router.post("/notifications/read", requireAuth, async (req, res) => {
  try {
    await markAllRead(req.user!.userId);
    res.json({ unreadCount: 0 });
  } catch (err) {
    console.error("POST /api/me/notifications/read error:", err);
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
