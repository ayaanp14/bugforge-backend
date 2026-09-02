import { prisma } from "../lib/prisma.js";

/**
 * Query functions shared by the per-widget /api/me routes and the aggregated
 * GET /api/me/dashboard endpoint. Each returns exactly the JSON its route used to.
 */

// ── Difficulty stats ────────────────────────────────────────────
export async function getDifficultyStats(userId: string) {
  const [totalProblems, userSubmissions] = await Promise.all([
    prisma.problem.groupBy({
      by: ["difficulty"],
      where: { isPublished: true },
      _count: { _all: true },
    }),
    prisma.submission.findMany({
      where: { userId, problem: { isPublished: true } },
      select: { problemId: true, verdict: true, problem: { select: { difficulty: true } } },
    }),
  ]);

  const totalMap: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  totalProblems.forEach((group) => {
    totalMap[group.difficulty.toLowerCase()] = group._count._all;
  });

  // Track best verdict per unique problem
  const best: Record<string, { difficulty: string; isSolved: boolean }> = {};
  userSubmissions.forEach((sub) => {
    const existing = best[sub.problemId];
    const isAccepted = sub.verdict === "ACCEPTED";
    if (!existing) {
      best[sub.problemId] = { difficulty: sub.problem.difficulty.toLowerCase(), isSolved: isAccepted };
    } else if (isAccepted) {
      existing.isSolved = true;
    }
  });

  const solvedMap: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  const attemptedMap: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  Object.values(best).forEach((p) => {
    if (p.isSolved) solvedMap[p.difficulty] = (solvedMap[p.difficulty] ?? 0) + 1;
    else attemptedMap[p.difficulty] = (attemptedMap[p.difficulty] ?? 0) + 1;
  });

  return {
    easy: { solved: solvedMap.easy, attempted: attemptedMap.easy, total: totalMap.easy },
    medium: { solved: solvedMap.medium, attempted: attemptedMap.medium, total: totalMap.medium },
    hard: { solved: solvedMap.hard, attempted: attemptedMap.hard, total: totalMap.hard },
  };
}

// ── Submission history (problems + bug hunts, newest first) ─────
export async function getSubmissionHistory(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [problemSubmissions, bugSubmissions] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      include: { problem: { select: { title: true, difficulty: true, slug: true } } },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.bugSubmission.findMany({
      where: { userId },
      include: { challenge: { select: { title: true, difficulty: true } } },
      orderBy: { submittedAt: "desc" },
    }),
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
      code: s.code,
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
      code: JSON.stringify(s.editedFiles, null, 2),
      submittedAt: s.submittedAt,
    })),
  ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return { history: history.slice(skip, skip + limit), total: history.length, page, limit };
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
  const problems = await prisma.problem.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, slug: true, difficulty: true, tags: true, createdAt: true, timeLimitMs: true },
    orderBy: { createdAt: "desc" },
    take,
  });
  if (problems.length === 0) return [];

  const submissions = await prisma.submission.findMany({
    where: { userId, problemId: { in: problems.map((p) => p.id) } },
    select: { problemId: true, verdict: true },
  });

  const statusMap: Record<string, "SOLVED" | "ATTEMPTING"> = {};
  submissions.forEach((sub) => {
    if (sub.verdict === "ACCEPTED") statusMap[sub.problemId] = "SOLVED";
    else if (statusMap[sub.problemId] !== "SOLVED") statusMap[sub.problemId] = "ATTEMPTING";
  });

  return problems.map((p) => ({ ...p, status: statusMap[p.id] || "UNSOLVED" }));
}

// ── Bug hunts + saved interviews ────────────────────────────────
export function getBugChallengeSummaries() {
  return prisma.bugChallenge.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, difficulty: true, category: true },
    orderBy: { createdAt: "desc" },
  });
}

export function countSavedInterviews(userId: string) {
  return prisma.savedInterview.count({ where: { userId } });
}

// ── The aggregate the dashboard loads in one request ────────────
export async function getDashboard(userId: string) {
  const [
    difficultyStats,
    submissions,
    heatmap,
    rank,
    leaderboard,
    pairing,
    continueSolving,
    problems,
    bugChallenges,
    savedInterviews,
  ] = await Promise.all([
    getDifficultyStats(userId),
    getSubmissionHistory(userId, 1, 25),
    getHeatmap(userId),
    getRank(userId, "combined"),
    getLeaderboard("combined"),
    getPairingHistory(userId, 1, 3),
    getContinueSolving(userId),
    listProblemsWithStatus(userId, 600),
    getBugChallengeSummaries(),
    countSavedInterviews(userId),
  ]);

  return { difficultyStats, submissions, heatmap, rank, leaderboard, pairing, continueSolving, problems, bugChallenges, savedInterviews };
}
