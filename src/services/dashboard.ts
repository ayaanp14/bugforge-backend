import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cached, cachedShared, invalidate } from "../lib/cache.js";
import { CALENDAR_UTC_OFFSET_MINUTES, dayKey, dayStart } from "../lib/clock.js";
import { getDashboardUser, invalidateMe } from "./me.js";
// daily-contest imports getCatalogue from here; both sides only call the other
// at request time (function declarations, live bindings), so the cycle is inert.
import { contestSnapshot } from "./daily-contest.js";

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
 *
 * Shared with GET /api/problems, whose plain first page is this list's head.
 */
export function getCatalogue(): Promise<CatalogueRow[]> {
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
  // The 365 days end today in the product calendar (lib/clock.ts, IST), and
  // every submission is bucketed into that same calendar in SQL. Days used to
  // be UTC on both sides — Prisma stores UTC and DATE_FORMAT read it as such
  // — so a solve at 1 am IST lit the previous day's square and the streak the
  // squares add up to disagreed with the one on the profile.
  const todayStart = dayStart(new Date());
  const oneYearAgo = new Date(todayStart.getTime() - 364 * 86_400_000);
  const today = new Date(todayStart.getTime() + 86_400_000 - 1);

  // One row per active day, counted by the database, instead of every accepted
  // submission of the year shipped over and bucketed here. Uses the (userId,
  // verdict, submittedAt) index; COUNT arrives as a BigInt.
  const rows = await prisma.$queryRaw<Array<{ d: string; n: bigint | number }>>(Prisma.sql`
    SELECT DATE_FORMAT(DATE_ADD(\`submittedAt\`, INTERVAL ${CALENDAR_UTC_OFFSET_MINUTES} MINUTE), '%Y-%m-%d') AS d, COUNT(*) AS n
    FROM \`Submission\`
    WHERE \`userId\` = ${userId}
      AND \`verdict\` = 'ACCEPTED'
      AND \`submittedAt\` >= ${oneYearAgo}
      AND \`submittedAt\` <= ${today}
    GROUP BY d
  `);

  const dailyCounts: Record<string, number> = {};
  let totalSubmissions = 0;
  for (const row of rows) {
    const n = Number(row.n);
    dailyCounts[row.d] = n;
    totalSubmissions += n;
  }

  const dates: string[] = [];
  for (let i = 0; i < 365; i++) {
    dates.push(dayKey(new Date(oneYearAgo.getTime() + i * 86_400_000)));
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
    totalSubmissions,
    activeDays,
    maxStreak,
    currentStreak,
    heatmapData: dates.map((date) => ({ date, count: dailyCounts[date] || 0 })),
  };
}

// ── Rank ────────────────────────────────────────────────────────
/** The XP column each leaderboard ranks by — whitelisted before it is spliced into SQL. */
const RANK_COLUMN = { combined: "xp", questions: "questionsXp", bugs: "bugsXp" } as const;

export async function getRank(userId: string, type = "combined") {
  const column = RANK_COLUMN[type === "questions" ? "questions" : type === "bugs" ? "bugs" : "combined"];
  const col = Prisma.raw("`" + column + "`");

  // The user's score and the number of users above it, in one statement. This
  // was two dependent round trips — read the score, then count — for a number
  // the database can compute from the score without handing it back first.
  // Reads the index on the column both times.
  const rows = await prisma.$queryRaw<Array<{ score: number; above: bigint | number }>>(Prisma.sql`
    SELECT u.${col} AS score,
           (SELECT COUNT(*) FROM \`User\` WHERE ${col} > u.${col}) AS above
    FROM \`User\` u
    WHERE u.\`id\` = ${userId}
  `);

  const row = rows[0];
  if (!row) return { rank: null as number | null };
  const rank: number | null = Number(row.score) > 0 ? Number(row.above) + 1 : null;
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
  let column: "xp" | "questionsXp" | "bugsXp" = "xp";
  if (type === "questions") column = "questionsXp";
  if (type === "bugs") column = "bugsXp";
  // Ties break on seniority, so two users on the same XP keep the same
  // order between cache refreshes instead of swapping places at random.
  const orderBy = [{ [column]: "desc" as const }, { createdAt: "asc" as const }];

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
/**
 * `withCode` decides whether the last submission's source travels with each
 * room. The pairing page needs it (its "view code" button opens the file), the
 * dashboard's arena card only reads the verdict — and the dashboard payload is
 * cached whole, so a MediumText per room there is paid for on every load.
 */
export async function getPairingHistory(userId: string, page = 1, limit = 10, withCode = true) {
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
          select: { verdict: true, code: withCode, language: true, submittedAt: true },
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

// ── Per-user counters, one statement ────────────────────────────
/**
 * Followers, following, posts and saved interviews are four COUNTs over four
 * indexed columns. Each is cheap; what is not cheap is four round trips to a
 * remote database, so they travel as sub-selects of one statement. COUNT
 * arrives as a BigInt and is narrowed before it reaches JSON.
 */
async function queryUserCounters(userId: string) {
  const rows = await prisma.$queryRaw<
    Array<{ followers: bigint | number; following: bigint | number; posts: bigint | number; savedInterviews: bigint | number }>
  >(Prisma.sql`
    SELECT
      (SELECT COUNT(*) FROM \`Follow\` WHERE \`followingId\` = ${userId}) AS followers,
      (SELECT COUNT(*) FROM \`Follow\` WHERE \`followerId\` = ${userId}) AS following,
      (SELECT COUNT(*) FROM \`Post\` WHERE \`userId\` = ${userId}) AS posts,
      (SELECT COUNT(*) FROM \`SavedInterview\` WHERE \`userId\` = ${userId}) AS savedInterviews
  `);
  const row = rows[0];
  return {
    social: {
      followers: Number(row?.followers ?? 0),
      following: Number(row?.following ?? 0),
      posts: Number(row?.posts ?? 0),
    },
    savedInterviews: Number(row?.savedInterviews ?? 0),
  };
}

/** Followers / following / posts — the dashboard hero and the community's social card. */
export async function querySocialCounts(userId: string) {
  const rows = await prisma.$queryRaw<
    Array<{ followers: bigint | number; following: bigint | number; posts: bigint | number }>
  >(Prisma.sql`
    SELECT
      (SELECT COUNT(*) FROM \`Follow\` WHERE \`followingId\` = ${userId}) AS followers,
      (SELECT COUNT(*) FROM \`Follow\` WHERE \`followerId\` = ${userId}) AS following,
      (SELECT COUNT(*) FROM \`Post\` WHERE \`userId\` = ${userId}) AS posts
  `);
  const row = rows[0];
  return {
    followers: Number(row?.followers ?? 0),
    following: Number(row?.following ?? 0),
    posts: Number(row?.posts ?? 0),
  };
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
 * Drop everything cached about a user — the dashboard aggregate and /api/me.
 * Call after anything that changes what they show (a submission, an XP award,
 * a follow, a post) so the next read is rebuilt rather than served stale.
 * Without this the TTL would be the only thing correcting it, and a user who
 * just solved a problem would watch their own stats fail to move.
 *
 * Both are cleared together because they are built from the same underlying
 * facts: forgetting one leaves the header and the page below it disagreeing.
 */
export function invalidateDashboard(userId: string): void {
  invalidate(dashboardKey(userId));
  invalidateMe(userId);
}

/**
 * Cached across instances and restarts. Composing this payload costs ~15
 * statements against a remote database, which is far more than one Redis round
 * trip, so it is the one thing here worth going over the network for.
 *
 * Dates serialise to ISO strings through Redis. That matches what res.json()
 * produces on a cache miss, so the HTTP response is byte-identical either way.
 */
export async function getDashboard(userId: string) {
  // 5 minutes, not 60s: a miss costs ~15 round trips at ~500ms each against the
  // remote database, so misses are what to avoid. Freshness is preserved by
  // invalidateDashboard() firing on every submission rather than by a short TTL.
  return cachedShared(dashboardKey(userId), 300, () => buildDashboard(userId));
}

async function buildDashboard(userId: string) {
  // difficultyStats and problemInsights both describe the same thing — which
  // published problems this user has solved — so the state behind them is loaded
  // once here and reduced twice, instead of each running its own pair of queries.
  // The four per-user counters (social + saved interviews) are one statement.
  const [
    me,
    counters,
    problemState,
    submissions,
    heatmap,
    rank,
    leaderboard,
    pairing,
    continueSolving,
    bugInsights,
    dailyContest,
  ] = await Promise.all([
    getDashboardUser(userId),
    queryUserCounters(userId),
    loadProblemState(userId),
    getSubmissionHistory(userId, 1, 5),
    getHeatmap(userId),
    getRank(userId, "combined"),
    getLeaderboard("combined"),
    getPairingHistory(userId, 1, 3, false),
    getContinueSolving(userId),
    getBugInsights(),
    contestSnapshot(userId),
  ]);

  const difficultyStats = computeDifficultyStats(problemState);
  const problemInsights = computeProblemInsights(problemState);
  const { social, savedInterviews } = counters;

  return { me, social, difficultyStats, submissions, heatmap, rank, leaderboard, pairing, continueSolving, problemInsights, bugInsights, savedInterviews, dailyContest };
}
