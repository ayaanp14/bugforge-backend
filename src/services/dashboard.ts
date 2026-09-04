import { prisma } from "../lib/prisma.js";
import { cached, cachedShared, invalidate } from "../lib/cache.js";
import { getDashboardUser, getSocialCounts } from "./me.js";

/**
 * Query functions shared by the per-widget /api/me routes and the aggregated
 * GET /api/me/dashboard endpoint. Each returns exactly the JSON its route used to.
 */

type CatalogueRow = {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  tags: unknown;
  createdAt: Date;
  timeLimitMs: number;
};

/** Which published problems this user has solved, and which they have only tried. */
export type ProblemState = {
  catalogue: CatalogueRow[];
  solved: Set<string>;
  attempted: Set<string>;
};

const tagsOf = (row: { tags: unknown }): string[] => (Array.isArray(row.tags) ? (row.tags as string[]) : []);

/**
 * The published catalogue is identical for every user, so it is fetched once per
 * TTL window rather than once per dashboard load. Previously this was re-read on
 * every request, 600 rows at a time, including a JSON tags column per row.
 */
function getCatalogue(): Promise<CatalogueRow[]> {
  return cached("catalogue:published", 120_000, () =>
    prisma.problem.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, slug: true, difficulty: true, tags: true, createdAt: true, timeLimitMs: true },
      orderBy: { createdAt: "desc" },
    }),
  );
}

/**
 * Solve status as two GROUP BYs returning one row per problem, rather than
 * pulling every submission row the user has ever made and reducing in JS. Both
 * hit the (userId, verdict, submittedAt) index.
 */
export async function loadProblemState(userId: string): Promise<ProblemState> {
  const [catalogue, solvedRows, touchedRows] = await Promise.all([
    getCatalogue(),
    prisma.submission.groupBy({ by: ["problemId"], where: { userId, verdict: "ACCEPTED" } }),
    prisma.submission.groupBy({ by: ["problemId"], where: { userId } }),
  ]);

  const solved = new Set(solvedRows.map((r) => r.problemId));
  const attempted = new Set(touchedRows.map((r) => r.problemId).filter((id) => !solved.has(id)));
  return { catalogue, solved, attempted };
}

// ── Difficulty stats ────────────────────────────────────────────
/** Pure computation over an already-loaded ProblemState — issues no queries. */
export function computeDifficultyStats(state: ProblemState) {
  const totalMap: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  const solvedMap: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  const attemptedMap: Record<string, number> = { easy: 0, medium: 0, hard: 0 };

  for (const p of state.catalogue) {
    const key = p.difficulty.toLowerCase();
    if (!(key in totalMap)) continue;
    totalMap[key] += 1;
    if (state.solved.has(p.id)) solvedMap[key] += 1;
    else if (state.attempted.has(p.id)) attemptedMap[key] += 1;
  }

  return {
    easy: { solved: solvedMap.easy, attempted: attemptedMap.easy, total: totalMap.easy },
    medium: { solved: solvedMap.medium, attempted: attemptedMap.medium, total: totalMap.medium },
    hard: { solved: solvedMap.hard, attempted: attemptedMap.hard, total: totalMap.hard },
  };
}

export async function getDifficultyStats(userId: string) {
  return computeDifficultyStats(await loadProblemState(userId));
}

// ── Submission history (problems + bug hunts, newest first) ─────
export async function getSubmissionHistory(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const window = skip + limit;

  // Slim rows only — no code/editedFiles (fetched on demand via
  // GET /api/me/submissions/:id) and only the page's window from each table.
  const [problemSubmissions, bugSubmissions, problemTotal, bugTotal] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      select: {
        id: true,
        verdict: true,
        language: true,
        runtimeMs: true,
        memoryKb: true,
        submittedAt: true,
        problem: { select: { title: true, difficulty: true, slug: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: window,
    }),
    prisma.bugSubmission.findMany({
      where: { userId },
      select: {
        id: true,
        verdict: true,
        timeTakenSecs: true,
        submittedAt: true,
        challenge: { select: { title: true, difficulty: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: window,
    }),
    prisma.submission.count({ where: { userId } }),
    prisma.bugSubmission.count({ where: { userId } }),
  ]);

  const history = [
    ...problemSubmissions.map((s) => ({
      id: s.id,
      type: "problem" as const,
      title: s.problem.title,
      problemSlug: s.problem.slug,
      difficulty: s.problem.difficulty,
      verdict: s.verdict,
      language: s.language,
      runtime: s.runtimeMs ? `${s.runtimeMs}ms` : "N/A",
      memory: s.memoryKb ? `${(s.memoryKb / 1024).toFixed(2)}MB` : "N/A",
      submittedAt: s.submittedAt,
    })),
    ...bugSubmissions.map((s) => ({
      id: s.id,
      type: "bug" as const,
      title: s.challenge.title,
      problemSlug: undefined as string | undefined,
      difficulty: s.challenge.difficulty,
      verdict: s.verdict,
      language: "JS/JSON",
      runtime: s.timeTakenSecs ? `${s.timeTakenSecs}s` : "N/A",
      memory: "N/A",
      submittedAt: s.submittedAt,
    })),
  ]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(skip, skip + limit);

  return { history, total: problemTotal + bugTotal, page, limit };
}

// ── 365-day accepted-solution heatmap ───────────────────────────
export async function getHeatmap(userId: string) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const oneYearAgo = new Date();
  oneYearAgo.setDate(today.getDate() - 364);
  oneYearAgo.setHours(0, 0, 0, 0);

  const submissions = await prisma.submission.findMany({
    where: { userId, verdict: "ACCEPTED", submittedAt: { gte: oneYearAgo, lte: today } },
    select: { submittedAt: true },
  });

  const dailyCounts: Record<string, number> = {};
  submissions.forEach((s) => {
    const dateStr = s.submittedAt.toISOString().split("T")[0];
    dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
  });

  const dates: string[] = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(oneYearAgo);
    d.setDate(oneYearAgo.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }

  let maxStreak = 0;
  let currentStreak = 0;
  let activeDays = 0;
  dates.forEach((date) => {
    if (dailyCounts[date]) {
      activeDays++;
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  });

  return {
    totalSubmissions: submissions.length,
    activeDays,
    maxStreak,
    currentStreak,
    heatmapData: dates.map((date) => ({ date, count: dailyCounts[date] || 0 })),
  };
}

// ── Rank ────────────────────────────────────────────────────────
export async function getRank(userId: string, type = "combined") {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, questionsXp: true, bugsXp: true },
  });
  if (!user) return { rank: null as number | null };

  let rank: number | null = null;
  if (type === "questions") {
    rank = user.questionsXp > 0 ? (await prisma.user.count({ where: { questionsXp: { gt: user.questionsXp } } })) + 1 : null;
  } else if (type === "bugs") {
    rank = user.bugsXp > 0 ? (await prisma.user.count({ where: { bugsXp: { gt: user.bugsXp } } })) + 1 : null;
  } else {
    rank = user.xp > 0 ? (await prisma.user.count({ where: { xp: { gt: user.xp } } })) + 1 : null;
  }
  return { rank };
}

// ── Leaderboard (top 10) ────────────────────────────────────────
export async function getLeaderboard(type = "combined") {
  // Normalise before it becomes a cache key: the route passes this straight from
  // the query string, and anything unrecognised already fell through to combined.
  const kind = type === "questions" ? "questions" : type === "bugs" ? "bugs" : "combined";
  // Same top 10 and same user count for everyone, so compute it once per window
  // instead of once per dashboard load.
  return cached(`leaderboard:${kind}`, 60_000, () => queryLeaderboard(kind));
}

async function queryLeaderboard(type: "combined" | "questions" | "bugs") {
  let orderBy: Record<string, "desc"> = { xp: "desc" };
  if (type === "questions") orderBy = { questionsXp: "desc" };
  if (type === "bugs") orderBy = { bugsXp: "desc" };

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
        stats: { select: { problemsSolved: true, bugsFixed: true } },
      },
    }),
    prisma.user.count(),
  ]);

  const rankings = topUsers.map((u) => {
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
      hasValue,
    };
  });

  return { rankings, totalUsers };
}

// ── Pairing history (closed rooms the user took part in) ────────
export async function getPairingHistory(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const where = { status: "closed", participants: { some: { userId } } };

  const [history, total] = await Promise.all([
    prisma.pairRoom.findMany({
      where,
      select: {
        id: true,
        endedAt: true,
        problem: { select: { title: true, difficulty: true } },
        participants: { select: { userId: true, user: { select: { name: true, avatar_url: true } } } },
        submissions: {
          select: { verdict: true, code: true, language: true, submittedAt: true },
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { endedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.pairRoom.count({ where }),
  ]);

  return { history, total };
}

// ── Continue solving: newest non-empty draft on an unsolved problem
export async function getContinueSolving(userId: string) {
  const draft = await prisma.codeDraft.findFirst({
    where: {
      userId,
      code: { not: "" },
      problem: { submissions: { none: { userId, verdict: "ACCEPTED" } } },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      updatedAt: true,
      language: true,
      problem: { select: { slug: true, title: true, difficulty: true } },
    },
  });

  if (!draft) return { problem: null };
  return {
    problem: {
      slug: draft.problem.slug,
      title: draft.problem.title,
      difficulty: draft.problem.difficulty,
      language: draft.language,
      updatedAt: draft.updatedAt.toISOString(),
    },
  };
}

// ── Catalogue with the user's per-problem status ────────────────
export async function listProblemsWithStatus(userId: string, take = 100) {
  const state = await loadProblemState(userId);
  return state.catalogue.slice(0, take).map((p) => ({
    ...p,
    status: state.solved.has(p.id) ? "SOLVED" : state.attempted.has(p.id) ? "ATTEMPTING" : "UNSOLVED",
  }));
}

// ── Bug hunts + saved interviews ────────────────────────────────
// Counts only — the dashboard never renders individual bug challenges
export async function getBugInsights() {
  // Catalogue-wide counts, identical for every user and changing only when a bug
  // challenge is published — a long window is safe here.
  return cached("bug-insights", 300_000, queryBugInsights);
}

async function queryBugInsights() {
  const [total, byDifficulty, cats] = await Promise.all([
    prisma.bugChallenge.count({ where: { isPublished: true } }),
    prisma.bugChallenge.groupBy({ by: ["difficulty"], where: { isPublished: true }, _count: { _all: true } }),
    prisma.bugChallenge.findMany({ where: { isPublished: true }, select: { category: true }, distinct: ["category"] }),
  ]);
  const byLevel: Record<string, number> = {};
  for (const g of byDifficulty) byLevel[(g.difficulty || "").toLowerCase()] = g._count._all;
  return { total, byLevel, categories: cats.map((c) => c.category).filter(Boolean) };
}

export function countSavedInterviews(userId: string) {
  return prisma.savedInterview.count({ where: { userId } });
}

// ── Tiny problem insights for the dashboard (instead of shipping the list) ──
/** Pure computation over an already-loaded ProblemState — issues no queries. */
export function computeProblemInsights(state: ProblemState) {
  const { catalogue, solved, attempted } = state;

  const topicMap = new Map<string, { tag: string; total: number; solved: number }>();
  const solvedTagSet = new Set<string>();
  const attempting: CatalogueRow[] = [];
  const untouched: CatalogueRow[] = [];
  let unsolvedCount = 0;

  // One pass: the previous version walked the list five separate times.
  for (const p of catalogue) {
    const isSolved = solved.has(p.id);
    const isAttempting = !isSolved && attempted.has(p.id);
    const tags = tagsOf(p);

    for (const tag of tags) {
      const t = topicMap.get(tag) ?? { tag, total: 0, solved: 0 };
      t.total++;
      if (isSolved) t.solved++;
      topicMap.set(tag, t);
    }

    if (isSolved) {
      for (const tag of tags) solvedTagSet.add(tag);
    } else {
      unsolvedCount++;
      if (isAttempting) attempting.push(p);
      else if (untouched.length < 3) untouched.push(p);
    }
  }

  const skills = [...topicMap.values()].sort((a, b) => b.total - a.total);
  const recommended = [...attempting, ...untouched]
    .slice(0, 3)
    .map((p) => ({ id: p.id, slug: p.slug, title: p.title, difficulty: p.difficulty, tags: tagsOf(p).slice(0, 2) }));

  return { skills, recommended, solvedTags: [...solvedTagSet].slice(0, 30), unsolvedCount };
}

export async function getProblemInsights(userId: string) {
  return computeProblemInsights(await loadProblemState(userId));
}

// ── The aggregate the dashboard loads in one request ────────────

const dashboardKey = (userId: string) => `dash:v1:${userId}`;

/**
 * Drop a user's cached dashboard. Call after anything that changes what it shows
 * — a submission, an XP award — so the next load is rebuilt rather than served
 * stale. Without this the 60s TTL would be the only thing correcting it, and a
 * user who just solved a problem would watch their own stats fail to move.
 */
export function invalidateDashboard(userId: string): void {
  invalidate(dashboardKey(userId));
}

/**
 * Cached across instances and restarts. Composing this payload costs ~18 queries
 * against a remote database, which is far more than one Redis round trip, so it
 * is the one thing here worth going over the network for.
 *
 * Dates serialise to ISO strings through Redis. That matches what res.json()
 * produces on a cache miss, so the HTTP response is byte-identical either way.
 */
export async function getDashboard(userId: string) {
  // 5 minutes, not 60s: a miss costs ~18 round trips at ~500ms each against the
  // remote database, so misses are what to avoid. Freshness is preserved by
  // invalidateDashboard() firing on every submission rather than by a short TTL.
  return cachedShared(dashboardKey(userId), 300, () => buildDashboard(userId));
}

async function buildDashboard(userId: string) {
  // difficultyStats and problemInsights both describe the same thing — which
  // published problems this user has solved — so the state behind them is loaded
  // once here and reduced twice, instead of each running its own pair of queries.
  const [
    me,
    social,
    problemState,
    submissions,
    heatmap,
    rank,
    leaderboard,
    pairing,
    continueSolving,
    bugInsights,
    savedInterviews,
  ] = await Promise.all([
    getDashboardUser(userId),
    getSocialCounts(userId),
    loadProblemState(userId),
    getSubmissionHistory(userId, 1, 5),
    getHeatmap(userId),
    getRank(userId, "combined"),
    getLeaderboard("combined"),
    getPairingHistory(userId, 1, 3),
    getContinueSolving(userId),
    getBugInsights(),
    countSavedInterviews(userId),
  ]);

  const difficultyStats = computeDifficultyStats(problemState);
  const problemInsights = computeProblemInsights(problemState);

  return { me, social, difficultyStats, submissions, heatmap, rank, leaderboard, pairing, continueSolving, problemInsights, bugInsights, savedInterviews };
}
