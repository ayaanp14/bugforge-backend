import { prisma } from "../lib/prisma.js";
import { cachedShared, invalidate } from "../lib/cache.js";
import { daysBetween } from "../lib/clock.js";
import { countSolved, getRank, loadProblemState, type ProblemState } from "./dashboard.js";

// Zero-based rank ladder: rating ≡ lifetime XP, so the bar moves from solve #1
export function getTierTitle(rating: number) {
  if (rating < 100) return "Novice";
  if (rating < 400) return "Apprentice";
  if (rating < 900) return "Adept";
  if (rating < 1500) return "Expert";
  return "Master";
}

export type UserTrends = { xpThisWeek: number; solvedToday: number; bugsFixedThisWeek: number };

const XP_BY_DIFFICULTY: Record<string, number> = { easy: 10, medium: 20, hard: 30 };

/**
 * Week/day activity trends, counting only FIRST-TIME solves.
 *
 * Shared by GET /api/me and the dashboard aggregate, which previously carried
 * two copies of this logic — both of which asked the database, once per problem
 * solved this week and awaited one at a time, "were there any earlier accepted
 * submissions for this problem?". That is an N+1 loop: at ~500ms per round trip
 * to the remote database it was the whole reason /api/me took ~5s, and it got
 * worse the more the user solved.
 *
 * The question that loop asked is just "when was this problem FIRST solved",
 * which is a MIN over one grouped query for every problem at once. A problem
 * counts as new this week exactly when that minimum falls inside the window.
 */
export async function getUserTrends(userId: string): Promise<UserTrends> {
  const now = Date.now();
  const last7Days = new Date(now - 7 * 24 * 3600 * 1000);
  const last24Hours = new Date(now - 24 * 3600 * 1000);

  // The bug count shares no data with the solve history, so it goes out now
  // rather than in the wave below — it was costing a full round trip to wait
  // for a result it never reads. The catch marks the promise handled so that
  // if the groupBy below throws first, this one does not surface as an
  // unhandled rejection; awaiting it later still propagates the error.
  const bugsFixedPromise = prisma.bugSubmission.count({
    where: { userId, verdict: "ACCEPTED", submittedAt: { gte: last7Days } },
  });
  bugsFixedPromise.catch(() => undefined);

  // One row per problem ever solved, carrying its earliest accepted submission.
  // Uses the (userId, verdict, submittedAt) index.
  const firstSolves = await prisma.submission.groupBy({
    by: ["problemId"],
    where: { userId, verdict: "ACCEPTED" },
    _min: { submittedAt: true },
  });

  const newThisWeek = firstSolves.filter((f) => {
    const first = f._min.submittedAt;
    return first !== null && first >= last7Days;
  });

  // Difficulties for just those few problems, alongside the bug count that
  // has been in flight since before the groupBy above.
  const [problems, bugsFixedThisWeek] = await Promise.all([
    newThisWeek.length > 0
      ? prisma.problem.findMany({
          where: { id: { in: newThisWeek.map((f) => f.problemId) } },
          select: { id: true, difficulty: true },
        })
      : Promise.resolve([] as Array<{ id: string; difficulty: string }>),
    bugsFixedPromise,
  ]);

  const difficultyOf = new Map(problems.map((p) => [p.id, p.difficulty.toLowerCase()]));

  let xpThisWeek = 0;
  let solvedToday = 0;
  for (const f of newThisWeek) {
    xpThisWeek += XP_BY_DIFFICULTY[difficultyOf.get(f.problemId) ?? ""] ?? 10;
    if (f._min.submittedAt! >= last24Hours) solvedToday++;
  }

  return { xpThisWeek, solvedToday, bugsFixedThisWeek };
}

// ── GET /api/me, minus the parts that must stay live ────────────

const meKey = (userId: string) => `me:v1:${userId}`;

/** Drop a user's cached /api/me payload after anything that changes it. */
export function invalidateMe(userId: string): void {
  invalidate(meKey(userId));
}

/** The profile columns a client may see. Every route that answers with a user row selects these — never the row itself, which carries the password hash. */
export const ME_SELECT = {
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
  remindStreak: true,
  remindDailyKata: true,
  weeklyDigest: true,
  xp: true,
  questionsXp: true,
  bugsXp: true,
  rating: true,
  provider: true,
  createdAt: true,
  /** The roadmap chests opened — the frame and the flair the account wears. */
  roadmapRewards: { select: { tierKey: true } },
  stats: {
    select: {
      problemsSolved: true,
      bugsFixed: true,
      currentStreak: true,
      longestStreak: true,
      lastActive: true,
    },
  },
} as const;

/**
 * The cacheable half of GET /api/me: the profile row plus activity trends.
 *
 * Deliberately excludes the unread-notification count. That number has to be
 * correct the moment a notification arrives, and caching it would leave the
 * bell showing a stale badge for the length of the TTL. It is a single indexed
 * query, so the route fetches it live and in parallel with this.
 */
export async function getMePayload(userId: string) {
  return cachedShared(meKey(userId), 300, () => buildMePayload(userId));
}

/**
 * The solved count and the rank an account is shown under, everywhere.
 *
 * Solved is derived (dashboard.ts countSolved); `UserStats.problemsSolved`
 * is a counter kept beside it for the leaderboard, and a counter drifts — a
 * catalogue reseed cascades old submissions away and the count stays, so one
 * profile read "6 solved" above a panel that said "1 of 598" (QA-048). The
 * counter is reconciled to the derived number whenever they disagree.
 *
 * The rank is the same statement the dashboard's rank tile runs (getRank);
 * the SPA's `globalRank` field had no source at all and the identity card
 * read "Unranked" beside a dashboard saying "#6".
 */
async function standingOf(
  userId: string,
  loads?: { problemState?: Promise<ProblemState>; rank?: Promise<{ rank: number | null }> },
): Promise<{ solved: number; globalRank: number | null }> {
  const [state, rank] = await Promise.all([loads?.problemState ?? loadProblemState(userId), loads?.rank ?? getRank(userId, "combined")]);
  return { solved: countSolved(state), globalRank: rank.rank };
}

async function buildMePayload(userId: string) {
  // The JWT already carries the id, so trends need not wait for the user row.
  const [fetched, trends, standing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: ME_SELECT }),
    getUserTrends(userId),
    standingOf(userId),
  ]);
  if (!fetched) return null;

  let user = fetched;

  // Counter drift and a lapsed streak are two corrections to the same row.
  // They used to be two awaited updates, which on an account needing both
  // cost two sequential round trips to write a handful of bytes; collected
  // here they are one. A streak that has lapsed is both displayed as zero and
  // persisted — running that only on a cache miss is fine, because the write
  // is idempotent and the cached copy already carries the corrected value.
  if (user.stats) {
    const fixes: { problemsSolved?: number; currentStreak?: number } = {};

    if (user.stats.problemsSolved !== standing.solved) {
      fixes.problemsSolved = standing.solved;
    }

    // Same calendar the judge extends the streak on (lib/clock.ts), or the
    // two would disagree around midnight.
    const diffDays = daysBetween(new Date(user.stats.lastActive), new Date());
    if (diffDays > 1 && user.stats.currentStreak > 0) {
      fixes.currentStreak = 0;
    }

    if (Object.keys(fixes).length > 0) {
      await prisma.userStats.update({ where: { userId: user.id }, data: fixes });
      if (fixes.problemsSolved !== undefined) user.stats.problemsSolved = fixes.problemsSolved;
      if (fixes.currentStreak !== undefined) user.stats.currentStreak = fixes.currentStreak;
    }
  }

  // Backfill a username for accounts created before usernames existed.
  if (!user.username) {
    const baseName = user.name || "user";
    let newUsername = baseName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (newUsername.length < 3) newUsername = "user_" + Math.random().toString(36).substring(2, 7);

    const existing = await prisma.user.findFirst({ where: { username: newUsername }, select: { id: true } });
    if (existing) newUsername += "_" + Math.random().toString(36).substring(2, 5);

    user = await prisma.user.update({
      where: { id: user.id },
      data: { username: newUsername },
      select: ME_SELECT,
    });
  }

  return { ...user, tierTitle: getTierTitle(user.rating), trends, globalRank: standing.globalRank };
}

/**
 * The user slice the dashboard needs (XP, stats, trends, tier) — folded into
 * GET /api/me/dashboard so the page renders from ONE request. Mirrors the
 * trend logic of GET /api/me (display-only: no streak writes here).
 */
export async function getDashboardUser(
  userId: string,
  loads?: { problemState?: Promise<ProblemState>; rank?: Promise<{ rank: number | null }> },
) {
  // The trends are independent of the user row, so they overlap rather than queue.
  const [user, trends, standing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        avatar_url: true,
        xp: true,
        questionsXp: true,
        bugsXp: true,
        rating: true,
        createdAt: true,
        roadmapRewards: { select: { tierKey: true } },
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
    }),
    getUserTrends(userId),
    standingOf(userId, loads),
  ]);
  if (!user) return null;

  // Display-adjust a stale streak (the /api/me route persists the reset)
  if (user.stats) {
    const diffDays = daysBetween(new Date(user.stats.lastActive), new Date());
    if (diffDays > 1 && user.stats.currentStreak > 0) {
      user.stats.currentStreak = 0;
    }
    // Likewise the solved counter: shown as derived, persisted by /api/me.
    user.stats.problemsSolved = standing.solved;
  }

  return {
    ...user,
    tierTitle: getTierTitle(user.rating),
    trends,
    globalRank: standing.globalRank,
  };
}
