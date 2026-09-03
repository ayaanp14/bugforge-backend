import { prisma } from "../lib/prisma.js";

export function getTierTitle(rating: number) {
  if (rating < 1200) return "Novice";
  if (rating < 1500) return "Warrior";
  if (rating < 1800) return "Elite";
  if (rating < 2100) return "Master";
  return "Legend";
}

/**
 * The user slice the dashboard needs (XP, stats, trends, tier) — folded into
 * GET /api/me/dashboard so the page renders from ONE request. Mirrors the
 * trend logic of GET /api/me (display-only: no streak writes here).
 */
export async function getDashboardUser(userId: string) {
  const user = await prisma.user.findUnique({
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
  });
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

  // Trends — only FIRST-TIME solves count (same rules as /api/me)
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const last24Hours = new Date(now.getTime() - 24 * 3600 * 1000);

  const recentSolved = await prisma.submission.findMany({
    where: { userId, verdict: "ACCEPTED", submittedAt: { gte: last7Days } },
    select: { problemId: true, submittedAt: true, problem: { select: { difficulty: true } } },
    distinct: ["problemId"],
  });

  let solvedToday = 0;
  let xpThisWeek = 0;
  const xpMap: Record<string, number> = { easy: 10, medium: 20, hard: 30 };
  for (const sub of recentSolved) {
    const solvedBefore = await prisma.submission.count({
      where: { userId, problemId: sub.problemId, verdict: "ACCEPTED", submittedAt: { lt: sub.submittedAt } },
    });
    if (solvedBefore === 0) {
      xpThisWeek += xpMap[sub.problem.difficulty.toLowerCase()] ?? 10;
      if (sub.submittedAt >= last24Hours) solvedToday++;
    }
  }

  const bugsFixedThisWeek = await prisma.bugSubmission.count({
    where: { userId, verdict: "ACCEPTED", submittedAt: { gte: last7Days } },
  });

  return {
    ...user,
    tierTitle: getTierTitle(user.rating),
    trends: { xpThisWeek, solvedToday, bugsFixedThisWeek },
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
