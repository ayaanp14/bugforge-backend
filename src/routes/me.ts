import { Router } from "express";
import { isAdminEmail, requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { getHeatmap, getSubmissionHistory, getPairingHistory, getDifficultyStats, getRank, getDashboard, invalidateDashboard } from "../services/dashboard.js";
import { ensureBaseline, listNotifications, getUnreadCount, markAllRead } from "../services/notifications.js";
import { getMePayload, invalidateMe } from "../services/me.js";

const router = Router();

/**
 * Page and page size from the query string, bounded. `?limit=100000` used to
 * pull a whole history in one query and `?page=-3` reached Prisma as a
 * negative skip and 500ed.
 */
function pageArgs(query: Record<string, unknown>, defaultLimit: number): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(query["page"] ?? ""), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query["limit"] ?? ""), 10) || defaultLimit));
  return { page, limit };
}

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
      },
      select: { id: true },
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
    // profile edits). The unread badge is cached separately, with a hard expiry
    // and invalidation on every write, so it is right the moment a notification
    // lands without costing a COUNT per page load.
    const [payload, unreadNotifications] = await Promise.all([
      getMePayload(userId),
      // Fail-soft: a notification-subsystem problem must never break /api/me,
      // since the whole app treats a failed /api/me as "not logged in".
      getUnreadCount(userId).catch((err) => {
        console.error("GET /api/me getUnreadCount error:", err);
        return 0;
      }),
    ]);

    if (!payload) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Derived from the token's email, not cached with the payload: whether the
    // account menu shows "Admin" must not lag a change to ADMIN_EMAIL.
    res.json({ ...payload, unreadNotifications, isAdmin: isAdminEmail(req.user!.email) });
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
    github, linkedin, twitter, readme,
    remindStreak, remindDailyKata, weeklyDigest,
  } = req.body;

  // Reminder switches: a boolean or absent. Anything else is a bad request
  // rather than a silently coerced "true".
  const flag = (value: unknown, field: string): boolean | undefined | { error: string } => {
    if (value === undefined) return undefined;
    if (typeof value !== "boolean") return { error: `${field} must be true or false.` };
    return value;
  };
  const flags = {
    remindStreak: flag(remindStreak, "remindStreak"),
    remindDailyKata: flag(remindDailyKata, "remindDailyKata"),
    weeklyDigest: flag(weeklyDigest, "weeklyDigest"),
  };
  for (const value of Object.values(flags)) {
    if (value && typeof value === "object") {
      res.status(400).json({ error: value.error });
      return;
    }
  }
  const prefs = flags as Record<keyof typeof flags, boolean | undefined>;

  // Every field is optional, but a field that is sent has a shape. They used
  // to be written as received: a non-string `username` reached `.length` and
  // 500ed, an empty one was stored (and the *second* person to do that got
  // "already taken"), and the link fields accepted anything — including a
  // `javascript:` URL for the profile page to render.
  const text = (value: unknown, max: number, field: string): string | null | { error: string } => {
    if (value === undefined) return null;
    if (value === null) return "";
    if (typeof value !== "string") return { error: `${field} must be text.` };
    if (value.length > max) return { error: `${field} is limited to ${max} characters.` };
    return value.trim();
  };
  const link = (value: unknown, field: string): string | null | { error: string } => {
    const raw = text(value, 300, field);
    if (raw === null || typeof raw === "object" || raw === "") return raw;
    if (!/^https?:\/\/[^\s]+$/i.test(raw)) return { error: `${field} must be an http(s) link.` };
    return raw;
  };
  const fields = {
    username: text(username, 20, "Username"),
    instituteName: text(instituteName, 120, "Institute"),
    avatar_url: text(avatar_url, 2048, "Avatar"),
    name: text(name, 80, "Name"),
    gender: text(gender, 32, "Gender"),
    location: text(location, 120, "Location"),
    website: link(website, "Website"),
    github: link(github, "GitHub"),
    linkedin: link(linkedin, "LinkedIn"),
    twitter: link(twitter, "Twitter"),
    readme: text(readme, 20_000, "Readme"),
  };
  for (const value of Object.values(fields)) {
    if (value && typeof value === "object") {
      res.status(400).json({ error: value.error });
      return;
    }
  }
  const clean = fields as Record<keyof typeof fields, string | null>;
  // Only an http(s) URL or a bundled avatar path may be an avatar.
  if (clean.avatar_url && !/^(https?:\/\/[^\s]+|\/[^\s]*)$/i.test(clean.avatar_url)) {
    res.status(400).json({ error: "Avatar must be a link." });
    return;
  }

  // 1. Strict Username Validation (No spaces, no special characters)
  if (clean.username !== null) {
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    clean.username = clean.username.toLowerCase();
    if (!usernameRegex.test(clean.username)) {
      res.status(400).json({ error: "Usernames are 3–20 characters: letters, numbers and underscores." });
      return;
    }

    // 2. Explicit Uniqueness Check
    const existingUser = await prisma.user.findFirst({
      where: {
        username: { equals: clean.username },
        id: { not: req.user!.userId }
      },
      select: { id: true },
    });
    if (existingUser) {
      res.status(400).json({ error: "Username is already taken." });
      return;
    }
  }

  try {
    const or = (value: string | null) => (value === null ? undefined : value);
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        username: or(clean.username),
        instituteName: or(clean.instituteName),
        avatar_url: or(clean.avatar_url),
        name: or(clean.name),
        gender: or(clean.gender),
        location: or(clean.location),
        birthday: birthday !== undefined ? (birthday && !isNaN(Date.parse(birthday)) ? new Date(birthday) : null) : undefined,
        website: or(clean.website),
        github: or(clean.github),
        linkedin: or(clean.linkedin),
        twitter: or(clean.twitter),
        readme: or(clean.readme),
        remindStreak: prefs.remindStreak,
        remindDailyKata: prefs.remindDailyKata,
        weeklyDigest: prefs.weeklyDigest,
      },
    });

    // The profile just changed — drop the cached /api/me so the next read
    // reflects it instead of serving the pre-edit copy for the TTL. The
    // dashboard carries its own copy of the name and avatar and preferred it,
    // so the hero kept the old identity for up to five minutes.
    invalidateMe(req.user!.userId);
    invalidateDashboard(req.user!.userId);

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
    const { page, limit } = pageArgs(req.query, 10);
    res.json(await getSubmissionHistory(req.user!.userId, page, limit));
  } catch (err) {
    console.error("GET /api/me/submissions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/pairing-history — returns sessions where the user was a participant (paginated)
router.get("/pairing-history", requireAuth, async (req, res) => {
  try {
    const { page, limit } = pageArgs(req.query, 10);
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
      getUnreadCount(userId),
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
