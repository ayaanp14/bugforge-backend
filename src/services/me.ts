import { prisma } from "../lib/prisma.js";
import { cachedShared, invalidate } from "../lib/cache.js";

// Zero-based dojo ladder: rating ≡ lifetime XP, so the bar moves from solve #1
export function getTierTitle(rating: number) {
  if (rating < 100) return "Novice";
  if (rating < 400) return "Ninja";
  if (rating < 900) return "Samurai";
  if (rating < 1500) return "Sensei";
  return "Shogun";
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

  // Difficulties for just those few problems, alongside the bug count.
  const [problems, bugsFixedThisWeek] = await Promise.all([
    newThisWeek.length > 0
      ? prisma.problem.findMany({
          where: { id: { in: newThisWeek.map((f) => f.problemId) } },
          select: { id: true, difficulty: true },
        })
      : Promise.resolve([] as Array<{ id: string; difficulty: string }>),
    prisma.bugSubmission.count({
      where: { userId, verdict: "ACCEPTED", submittedAt: { gte: last7Days } },
    }),
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

const ME_SELECT = {
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

async function buildMePayload(userId: string) {
  // The JWT already carries the id, so trends need not wait for the user row.
  const [fetched, trends] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: ME_SELECT }),
    getUserTrends(userId),
  ]);
  if (!fetched) return null;

  let user = fetched;

  // A streak that has lapsed is both displayed as zero and persisted. Running
  // this only on a cache miss is fine: the write is idempotent and the cached
  // copy already carries the corrected value.
  if (user.stats) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = new Date(user.stats.lastActive);
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / 86400000);

    if (diffDays > 1 && user.stats.currentStreak > 0) {
      await prisma.userStats.update({ where: { userId: user.id }, data: { currentStreak: 0 } });
      user.stats.currentStreak = 0;
    }
  }

  // Backfill a username for accounts created before usernames existed.
  if (!user.username) {
    const baseName = user.name || "user";
    let newUsername = baseName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (newUsername.length < 3) newUsername = "user_" + Math.random().toString(36).substring(2, 7);

    const existing = await prisma.user.findFirst({ where: { username: newUsername } });
    if (existing) newUsername += "_" + Math.random().toString(36).substring(2, 5);

    user = await prisma.user.update({
      where: { id: user.id },
      data: { username: newUsername },
      select: ME_SELECT,
    });
  }

  return { ...user, tierTitle: getTierTitle(user.rating), trends };
}

/**
 * The user slice the dashboard needs (XP, stats, trends, tier) — folded into
 * GET /api/me/dashboard so the page renders from ONE request. Mirrors the
 * trend logic of GET /api/me (display-only: no streak writes here).
 */
export async function getDashboardUser(userId: string) {
  // The trends are independent of the user row, so they overlap rather than queue.
  const [user, trends] = await Promise.all([
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
  ]);
  if (!user) return null;

  // Display-adjust a stale streak (the /api/me route persists the reset)
  if (user.stats) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = new Date(user.stats.lastActive);
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / 86400000);
    if (diffDays > 1 && user.stats.currentStreak > 0) {
      user.stats.currentStreak = 0;
    }
  }

  return {
    ...user,
    tierTitle: getTierTitle(user.rating),
    trends,
  };
}

/** Followers / following / posts — for the dashboard hero. */
export async function getSocialCounts(userId: string) {
  const [followers, following, posts] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.post.count({ where: { userId } }),
  ]);
  return { followers, following, posts };
}
