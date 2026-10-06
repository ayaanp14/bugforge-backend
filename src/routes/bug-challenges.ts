import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { browserCache, SEEDED_CONTENT_MAX_AGE } from "../lib/http-cache.js";
import { cachedShared } from "../lib/cache.js";
import { executionLimiter } from "../middleware/rate-limit.js";
import { judgeBugProject, type BugFile, type BugLanguage } from "../lib/bug-judge.js";
import { containsReservedMarker } from "../lib/batch.js";
import { invalidateDashboard } from "../services/dashboard.js";
import { emitDuelActivity, findLiveDuelFor, settleDuelForSubmission } from "../lib/duels.js";
import { ENGINE_DOWN_MESSAGE, isEngineDown } from "../lib/engine-error.js";
import { checkBugQuota } from "../services/entitlements.js";
import {
  DEFAULT_PAGE_SIZE,
  bugHubIndex,
  bugHubPage,
  bugIdFor,
  forgetBugSolved,
  getBugHuntIndex,
  getBugHuntPage,
  getNeighbours,
} from "../services/bug-hunts.js";

const router = Router();

const BUG_XP = 50;

/** What the judge needs of a challenge: the files to merge and the tests to run, nothing of the prose. */
const JUDGE_CHALLENGE_SELECT = {
  id: true,
  isPublished: true,
  language: true,
  files: { select: { filePath: true, content: true, isEditable: true } },
} as const;

/**
 * GET /api/bug-challenges — the paginated hunts index.
 *
 * Two modes, so the page costs one request on first paint and one per
 * "Load more" after that:
 *
 *   no `category`  → first `limit` of every category, plus catalogue totals
 *                    and the tag list for the filter dropdown
 *   with `category` → that category's slice at `offset`
 *
 * Filters (search, difficulty, language, tag) apply in SQL in both modes, so
 * they search the whole catalogue rather than only the rows already loaded.
 */
router.get("/", optionalAuth, browserCache(60), async (req, res) => {
  try {
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

    const filters = {
      search: str(req.query["search"]),
      difficulty: str(req.query["difficulty"]),
      language: str(req.query["language"]),
      tag: str(req.query["tag"]),
    };

    // Clamped: `limit` comes straight from the query string.
    const limit = Math.min(Math.max(Number(req.query["limit"]) || DEFAULT_PAGE_SIZE, 1), 100);
    const offset = Math.max(Number(req.query["offset"]) || 0, 0);
    const category = str(req.query["category"]);
    const userId = req.user?.userId;

    res.json(
      category
        ? await getBugHuntPage(category, filters, limit, offset, userId)
        : await getBugHuntIndex(filters, limit, userId),
    );
  } catch (err) {
    console.error("GET /api/bug-challenges error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * The hub pages (lib/bug-hubs): one per language and one per category,
 * each the whole slice of the catalogue in display order. Read from the
 * cached rows, so neither costs a query. Declared before /:id so "hubs" is
 * never taken for a hunt.
 *
 *   GET /api/bug-challenges/hubs             → { languages, categories }
 *   GET /api/bug-challenges/hubs/javascript  → the hub page, or 404
 */
// Seeded content with no reader in it — `bugHubIndex` takes no user — so one
// copy is every caller's, the way the problem hubs are cached.
router.get("/hubs", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (_req, res) => {
  try {
    res.json(await bugHubIndex());
  } catch (err) {
    console.error("GET /api/bug-challenges/hubs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/hubs/:id", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (req, res) => {
  try {
    const page = await bugHubPage(String(req.params.id).toLowerCase());
    if (!page) {
      res.status(404).json({ error: "No such hub" });
      return;
    }
    res.json(page);
  } catch (err) {
    console.error("GET /api/bug-challenges/hubs/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bug-challenges/:id/neighbours — prev/next for the workspace nav.
// Declared before /:id so the extra segment isn't swallowed by it.
// Position in the catalogue: the same two ids for everyone who asks.
router.get("/:id/neighbours", optionalAuth, browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (req, res) => {
  try {
    res.json(await getNeighbours(String(req.params.id)));
  } catch (err) {
    console.error("GET /api/bug-challenges/:id/neighbours error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Consecutive days (ending today or yesterday) with at least one accepted
 * fix, from the distinct days themselves — grouped in SQL, newest first,
 * rather than every accepted row the user has ever written being fetched and
 * bucketed here. 400 days is longer than any streak anybody will hold.
 *
 * UTC days, as before: DATE() of a DATETIME Prisma stores in UTC.
 */
async function bugStreakDays(userId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ d: Date | string }>>`
    SELECT DATE(\`submittedAt\`) AS d
    FROM \`BugSubmission\`
    WHERE \`userId\` = ${userId} AND \`verdict\` = 'ACCEPTED'
    GROUP BY d
    ORDER BY d DESC
    LIMIT 400
  `;
  // The driver hands a DATE back as either a Date at midnight or "YYYY-MM-DD";
  // both become a day number the same way the old bucketing did.
  const dayOf = (d: Date | string) =>
    d instanceof Date
      ? Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
      : Math.floor(Date.parse(`${String(d).slice(0, 10)}T00:00:00Z`) / 86400000);
  const days = rows.map((r) => dayOf(r.d)).filter((n) => Number.isFinite(n));

  const today = Math.floor(Date.now() / 86400000);
  let cursor = days[0] === today ? today : today - 1;
  let streak = 0;
  for (const day of days) {
    if (day !== cursor) break;
    streak++;
    cursor--;
  }
  return streak;
}

// GET /api/bug-challenges/stats/me — personal analytics for the hunts page
// (declared before /:id so "stats" is never treated as a challenge id)
router.get("/stats/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [recent, streak, totalSubmissions] = await Promise.all([
      prisma.bugSubmission.findMany({
        where: { userId },
        orderBy: { submittedAt: "desc" },
        take: 8,
        select: {
          id: true,
          verdict: true,
          passedTests: true,
          totalTests: true,
          submittedAt: true,
          challenge: { select: { id: true, title: true } },
        },
      }),
      bugStreakDays(userId),
      prisma.bugSubmission.count({ where: { userId } }),
    ]);

    res.json({
      streakDays: streak,
      totalSubmissions,
      recent: recent.map((r) => ({
        id: r.id,
        verdict: r.verdict,
        passedTests: r.passedTests,
        totalTests: r.totalTests,
        submittedAt: r.submittedAt,
        challengeId: r.challenge.id,
        challengeTitle: r.challenge.title,
      })),
    });
  } catch (err) {
    console.error("GET /api/bug-challenges/stats/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * A hunt as every reader gets it: the prose (three MediumText columns), every
 * file's content, the visible tests' names and how many are hidden — the
 * heaviest read on the hunt page, and the same bytes for everyone. Shared for
 * ten minutes (L1 + Redis). Nothing in the API writes a hunt, its files or its
 * tests — scripts/seed-bugs.ts does, and its flush (scripts/content-caches,
 * family "bug:") drops these keys with the rest of the catalogue's.
 *
 * Exactly the fields the route always sent, nothing more: hidden tests are a
 * count, never their commands or expected output. Null for a hunt that is
 * gone or unpublished — reached only in the moment between that change and
 * the catalogue order's refresh (bugIdFor), and never kept long: a null
 * reads as a miss from Redis, so it lives only in the memory tier — 30 s,
 * and one read past that while it refreshes.
 */
const BUG_DETAIL_TTL_SECONDS = 600;
const bugDetailKey = (challengeId: string) => `bug:detail:v1:${challengeId}`;

async function loadBugDetail(challengeId: string) {
  const [challenge, hiddenTestCount] = await Promise.all([
    prisma.bugChallenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        slug: true,
        title: true,
        difficulty: true,
        category: true,
        language: true,
        tags: true,
        origin: true,
        description: true,
        bugReport: true,
        logs: true,
        isPublished: true,
        files: { select: { id: true, filePath: true, content: true, isEditable: true, language: true } },
        tests: { where: { isHidden: false }, select: { id: true, name: true } },
      },
    }),
    prisma.challengeTest.count({
      where: { challengeId, isHidden: true },
    }),
  ]);
  if (!challenge || !challenge.isPublished) return null;
  return {
    id: challenge.id,
    slug: challenge.slug,
    title: challenge.title,
    difficulty: challenge.difficulty,
    category: challenge.category,
    language: challenge.language,
    tags: challenge.tags,
    origin: challenge.origin,
    description: challenge.description,
    bugReport: challenge.bugReport,
    logs: challenge.logs,
    files: challenge.files,
    visibleTests: challenge.tests,
    hiddenTestCount,
    xp: BUG_XP,
  };
}

const huntDetail = (challengeId: string) =>
  cachedShared(bugDetailKey(challengeId), BUG_DETAIL_TTL_SECONDS, () => loadBugDetail(challengeId));

/**
 * The hunter's own side of a hunt: their last 20 submissions, whether one was
 * accepted, and the live duel this hunt is the arena of — so the workspace can
 * send them to the room without asking the duel API separately on every
 * open. Gated by the in-process tracker, so for everyone not duelling the duel
 * lookup costs nothing.
 */
async function hunterStanding(userId: string, challengeId: string) {
  const [submissions, liveDuel] = await Promise.all([
    prisma.bugSubmission.findMany({
      where: { userId, challengeId },
      select: { id: true, verdict: true, passedTests: true, totalTests: true, timeTakenSecs: true, submittedAt: true },
      orderBy: { submittedAt: "desc" },
      take: 20,
    }),
    findLiveDuelFor(userId, { challengeId }),
  ]);
  return {
    solved: submissions.some((s) => s.verdict === "ACCEPTED"),
    submissions,
    // Contract with the workspace: the caller's live duel on this very
    // hunt, or null.
    activeDuelId: liveDuel?.id ?? null,
  };
}

const SIGNED_OUT_STANDING = { solved: false, submissions: [], activeDuelId: null };
const HUNT_NOT_FOUND = { error: "Challenge not found" };

// The address is the slug (/bug-hunts/the-checkout-meltdown) or, on a link
// minted before slugs existed, the id; the cached order resolves either
// without a round trip (bugIdFor). Unknown or unpublished is a 404 either way
// — and only a published hunt's id ever becomes a cache key.
//
// The SPA reads a hunt in two halves, the way the problem page reads a
// problem (/api/problems/:slug + /:slug/submissions), because they are cached
// differently:
//
//   GET /:id/content   the hunt — files, report, visible tests. Seeded and the
//                      same for everyone, so any browser keeps it for
//                      SEEDED_CONTENT_MAX_AGE and a hunt opened again draws
//                      from disk.
//   GET /:id/standing  hunterStanding — never kept: a stale `solved` or duel
//                      is worse than the round trip.
//   GET /:id           both at once, as the mobile app (and any SPA tab older
//                      than the split) reads it.
router.get("/:id/content", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (req, res) => {
  try {
    const challengeId = await bugIdFor(String(req.params.id));
    const challenge = challengeId ? await huntDetail(challengeId) : null;
    if (!challenge) {
      // A hunt published later must not be a 404 in somebody's disk cache.
      res.removeHeader("Cache-Control");
      res.status(404).json(HUNT_NOT_FOUND);
      return;
    }
    res.json(challenge);
  } catch (err) {
    console.error("GET /api/bug-challenges/:id/content error:", err);
    res.removeHeader("Cache-Control");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/standing", requireAuth, async (req, res) => {
  try {
    const challengeId = await bugIdFor(String(req.params.id));
    if (!challengeId) {
      res.status(404).json(HUNT_NOT_FOUND);
      return;
    }
    res.json(await hunterStanding(req.user!.userId, challengeId));
  } catch (err) {
    console.error("GET /api/bug-challenges/:id/standing error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const challengeId = await bugIdFor(String(req.params.id));
    if (!challengeId) {
      res.status(404).json(HUNT_NOT_FOUND);
      return;
    }
    const [challenge, standing] = await Promise.all([
      huntDetail(challengeId),
      req.user ? hunterStanding(req.user.userId, challengeId) : Promise.resolve(SIGNED_OUT_STANDING),
    ]);
    if (!challenge) {
      res.status(404).json(HUNT_NOT_FOUND);
      return;
    }
    res.json({ ...standing, ...challenge });
  } catch (err) {
    console.error("GET /api/bug-challenges/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** Merge the hunter's edited files over the challenge's originals.
 *  Locked files always come from the DB — client copies are ignored. */
/**
 * Edits are taken as given, but a file that mentions the batch protocol's
 * markers is refused before anything runs: a hunt's expected output is the
 * constant "PASS", so printing it followed by the case sentinel from any
 * editable file used to pass every hidden test. The judge also ignores
 * whatever a project prints ahead of the harness's own block; this is the
 * cheap half of that defence. Null when a value is not a string.
 */
function readEditedFiles(raw: unknown): { files: Record<string, string> } | { error: string } {
  if (raw == null) return { files: {} };
  if (typeof raw !== "object" || Array.isArray(raw)) return { error: "editedFiles must be an object of path → content" };
  const files: Record<string, string> = {};
  for (const [path, content] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof content !== "string") return { error: `File ${path} must be a string` };
    if (content.length > 200_000) return { error: `File ${path} is too large` };
    if (containsReservedMarker(content)) return { error: "Files must not contain the reserved marker __CODEKAIRO_" };
    files[path] = content;
  }
  return { files };
}

function mergeFiles(
  original: Array<{ filePath: string; content: string; isEditable: boolean }>,
  edited: Record<string, string> | undefined
): BugFile[] {
  return original.map((f) => ({
    filePath: f.filePath,
    content: f.isEditable && edited && typeof edited[f.filePath] === "string" ? edited[f.filePath] : f.content,
  }));
}

// POST /api/bug-challenges/:id/run — Run the VISIBLE tests only
//
// Behind the same per-user execution budget as the problem judge. These two
// routes sat under only the general limiter, so the bug workspace could drive
// ten times as many engine runs a minute as the problem workspace.
router.post("/:id/run", requireAuth, executionLimiter, async (req, res) => {
  try {
    const edited = readEditedFiles((req.body as { editedFiles?: unknown }).editedFiles);
    if ("error" in edited) {
      res.status(400).json({ error: edited.error });
      return;
    }
    const editedFiles = edited.files;

    // By id from the workspace, by slug from anywhere else — both resolve.
    const runId = await bugIdFor(String(req.params.id));
    if (!runId) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }
    const challenge = await prisma.bugChallenge.findUnique({
      where: { id: runId },
      select: {
        ...JUDGE_CHALLENGE_SELECT,
        tests: { where: { isHidden: false }, select: { name: true, runCommand: true } },
      },
    });
    if (!challenge || !challenge.isPublished) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }
    if (challenge.tests.length === 0) {
      res.status(400).json({ error: "Challenge has no visible tests" });
      return;
    }

    // Mid-duel, the other side sees you reach for Run — and how it went.
    const duelTarget = { challengeId: challenge.id };
    void emitDuelActivity(req.user!.userId, duelTarget, { type: "running" });

    const files = mergeFiles(challenge.files, editedFiles);
    const result = await judgeBugProject(
      files,
      challenge.tests.map((t) => ({ name: t.name, source: t.runCommand })),
      challenge.language as BugLanguage
    );

    void emitDuelActivity(req.user!.userId, duelTarget, {
      type: "ran",
      passed: result.passedTests,
      total: result.totalTests,
    });

    res.json(result);
  } catch (err) {
    if (isEngineDown(err)) {
      console.error("POST /api/bug-challenges/:id/run — engine down:", err.message);
      res.status(503).json({ error: ENGINE_DOWN_MESSAGE, engineDown: true });
      return;
    }
    console.error("POST /api/bug-challenges/:id/run error:", err);
    res.status(500).json({ error: "Failed to run tests" });
  }
});

// POST /api/bug-challenges/:id/submit — Run ALL tests (visible + hidden)
//
// Same shape as the problem judge's submit: every read the verdict will need
// goes out together before the engine is asked, the verdict is written in one
// transaction, the response leaves, and the duel, the dashboard cache and the
// bell are told afterwards.
router.post("/:id/submit", requireAuth, executionLimiter, async (req, res) => {
  try {
    const { timeTakenSecs } = req.body as { timeTakenSecs?: number };
    const edited = readEditedFiles((req.body as { editedFiles?: unknown }).editedFiles);
    if ("error" in edited) {
      res.status(400).json({ error: edited.error });
      return;
    }
    const editedFiles = edited.files;
    const userId = req.user!.userId;
    const challengeId = await bugIdFor(String(req.params.id));
    if (!challengeId) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }

    // A bug already worked today is always allowed through, so the daily
    // allowance buys distinct challenges rather than attempts — the first
    // failed run must not lock someone out of finishing what they started.
    // The quota needs only the id, so it is checked alongside the load.
    const [challenge, alreadySolved, quota] = await Promise.all([
      prisma.bugChallenge.findUnique({
        where: { id: challengeId },
        select: {
          ...JUDGE_CHALLENGE_SELECT,
          tests: { select: { name: true, runCommand: true, isHidden: true } },
        },
      }),
      prisma.bugSubmission.findFirst({
        where: { userId, challengeId, verdict: "ACCEPTED" },
        select: { id: true },
      }),
      checkBugQuota(userId, challengeId, req.user!.email),
    ]);
    if (!challenge || !challenge.isPublished) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }
    if (quota) {
      res.status(402).json(quota);
      return;
    }

    // The tensest moment in a duel: the other side is submitting.
    void emitDuelActivity(userId, { challengeId: challenge.id }, { type: "submitting" });

    const files = mergeFiles(challenge.files, editedFiles);
    const result = await judgeBugProject(
      files,
      challenge.tests.map((t) => ({ name: t.name, source: t.runCommand })),
      challenge.language as BugLanguage
    );

    // Hide hidden-test failure details; reveal only names + pass/fail
    const hiddenNames = new Set(challenge.tests.filter((t) => t.isHidden).map((t) => t.name));
    const publicResults = result.results.map((r) =>
      hiddenNames.has(r.name) ? { ...r, detail: r.passed ? "" : "Hidden test failed" } : r
    );

    const firstSolve = result.verdict === "ACCEPTED" && !alreadySolved;
    const awardedXp = firstSolve ? BUG_XP : 0;

    // The submission row, the XP and the stats land together or not at all.
    // Neither branch below reads the row back, and `editedFiles` is the
    // whole edited project — echoing it to the server and straight back again
    // was the largest thing on a hunt submit.
    const submissionCreate = prisma.bugSubmission.create({
      select: { id: true },
      data: {
        userId,
        challengeId: challenge.id,
        editedFiles: editedFiles ?? {},
        verdict: result.verdict,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
        // Client-reported (there is no server-side timer for hunts), so at
        // least bounded: a day, not whatever number was typed into the request.
        timeTakenSecs:
          typeof timeTakenSecs === "number" && Number.isFinite(timeTakenSecs)
            ? Math.min(24 * 3600, Math.max(0, Math.round(timeTakenSecs)))
            : null,
      },
    });
    if (firstSolve) {
      await prisma.$transaction([
        submissionCreate,
        prisma.user.update({
          where: { id: userId },
          data: {
            xp: { increment: BUG_XP },
            bugsXp: { increment: BUG_XP },
            // Rating climbs with every first fix — powers the tier bar
            rating: { increment: BUG_XP },
          },
        }),
        prisma.userStats.upsert({
          where: { userId },
          update: { bugsFixed: { increment: 1 }, lastActive: new Date() },
          create: { userId, bugsFixed: 1 },
        }),
      ]);
    } else {
      await submissionCreate;
    }

    res.json({ ...result, results: publicResults, awardedXp, firstSolve });

    // ── After the response ──────────────────────────────────────────
    // The dashboard aggregate is cached; this submission just changed it.
    invalidateDashboard(userId);
    // So is the hunts list's solved set, which only an accepted fix moves.
    // Still before the client can ask again: this runs in the same tick as
    // the response's write.
    if (result.verdict === "ACCEPTED") forgetBugSolved(userId);

    // If this fix landed inside a duel, the duel is decided right here — the
    // Duels never wait for the client to tell it what the judge already knows.
    settleDuelForSubmission(
      userId,
      { challengeId: challenge.id },
      { verdict: result.verdict, passed: result.passedTests, total: result.totalTests },
    ).catch((err) => console.error("POST /api/bug-challenges/:id/submit — duel settlement failed:", err));
  } catch (err) {
    // The verdict may already be on its way; the bookkeeping after it must
    // not be able to answer twice.
    if (res.headersSent) {
      console.error("POST /api/bug-challenges/:id/submit — after-response error:", err);
      return;
    }
    if (isEngineDown(err)) {
      console.error("POST /api/bug-challenges/:id/submit — engine down:", err.message);
      res.status(503).json({ error: ENGINE_DOWN_MESSAGE, engineDown: true });
      return;
    }
    console.error("POST /api/bug-challenges/:id/submit error:", err);
    res.status(500).json({ error: "Failed to submit fix" });
  }
});

export default router;
