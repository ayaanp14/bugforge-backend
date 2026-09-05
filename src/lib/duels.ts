/**
 * Duel settlement, kept next to the judge rather than in the route.
 *
 * A duel is decided by a submission row, and submission rows are written in two
 * other places (the problem judge and the bug judge). If only the duel room's
 * "I submitted" ping could settle a duel, then solving in any other tab — or
 * simply walking into the hunt workspace — would leave the duel hanging with
 * nobody declared the winner. So the judges call in here directly the moment a
 * verdict exists, and the duel room's ping becomes a safety net rather than the
 * mechanism.
 */
import { prisma } from "./prisma.js";
import { duelRoom, emitToRoom } from "./realtime.js";

export const DUEL_PARTICIPANT_SELECT = {
  id: true,
  userId: true,
  team: true,
  ready: true,
  passed: true,
  total: true,
  verdict: true,
  finishedAt: true,
  xpAwarded: true,
  joinedAt: true,
  user: { select: { id: true, name: true, username: true, avatar_url: true, xp: true, rating: true } },
} as const;

export const DUEL_INCLUDE = {
  participants: { select: DUEL_PARTICIPANT_SELECT, orderBy: { joinedAt: "asc" } },
  problem: { select: { id: true, slug: true, title: true, difficulty: true } },
  challenge: { select: { id: true, title: true, difficulty: true, language: true } },
} as const;

/** Duel XP: winners by difficulty, losers keep a quarter for showing up. */
const WIN_XP: Record<string, number> = { easy: 40, medium: 60, hard: 90 };
export const winXp = (difficulty?: string | null) => WIN_XP[(difficulty ?? "").toLowerCase()] ?? 50;

export async function loadDuel(id: string) {
  return prisma.duel.findUnique({ where: { id }, include: DUEL_INCLUDE });
}

export type JudgeResult = { verdict: string; passed: number; total: number };

/**
 * Record one warrior's verdict against a live duel and, if it is the first
 * accepted one, end the duel and pay everyone out. Returns the duel as it now
 * stands, or null when there was nothing to apply.
 */
export async function applyDuelResult(
  duelId: string,
  userId: string,
  result: JudgeResult,
): Promise<Awaited<ReturnType<typeof loadDuel>> | null> {
  const duel = await loadDuel(duelId);
  if (!duel || duel.status !== "active" || !duel.startedAt) return duel ?? null;

  const me = duel.participants.find((p) => p.userId === userId);
  if (!me) return duel;

  const solved = result.verdict.toUpperCase() === "ACCEPTED";
  await prisma.duelParticipant.update({
    where: { id: me.id },
    data: {
      passed: result.passed,
      total: result.total,
      verdict: result.verdict,
      ...(solved ? { finishedAt: new Date() } : {}),
    },
  });

  // First accepted submission ends it for everyone.
  if (solved && duel.winnerTeam == null) {
    const prize = winXp(duel.problem?.difficulty ?? duel.challenge?.difficulty);
    const consolation = Math.round(prize * 0.25);

    await prisma.duel.update({
      where: { id: duelId },
      data: { status: "finished", endedAt: new Date(), winnerTeam: me.team },
    });

    for (const p of duel.participants) {
      const won = p.team === me.team;
      const award = won ? prize : consolation;
      await prisma.duelParticipant.update({ where: { id: p.id }, data: { xpAwarded: award } });
      await prisma.user.update({
        where: { id: p.userId },
        data: { xp: { increment: award }, rating: { increment: won ? Math.round(prize / 3) : 0 } },
      });
    }

    const finished = await loadDuel(duelId);
    emitToRoom(duelRoom(duelId), "duel-finished", finished);
    return finished;
  }

  const progressed = await loadDuel(duelId);
  emitToRoom(duelRoom(duelId), "duel-update", progressed);
  return progressed;
}

/**
 * Live shoulder-glancing: tell the other side what this warrior is doing.
 *
 * It comes from the judges rather than the browsers for the same reason the
 * verdict does — a client could otherwise announce "5/5, submitting now" purely
 * to rattle an opponent. Nothing is stored; it is a nudge, not a record.
 */
export async function emitDuelActivity(
  userId: string,
  target: { problemId?: string | null; challengeId?: string | null },
  activity: { type: "running" | "ran" | "submitting"; passed?: number; total?: number },
): Promise<void> {
  try {
    const where = target.challengeId
      ? { challengeId: target.challengeId }
      : target.problemId
        ? { problemId: target.problemId }
        : null;
    if (!where) return;

    const duel = await prisma.duel.findFirst({
      where: { ...where, status: "active", participants: { some: { userId } } },
      select: { id: true },
    });
    if (!duel) return;

    emitToRoom(duelRoom(duel.id), "duel-activity", { duelId: duel.id, userId, ...activity, at: Date.now() });
  } catch (err) {
    console.error("emitDuelActivity error:", err);
  }
}

/**
 * Self-healing: an active duel whose target already has an accepted submission
 * from one of its warriors is over — it just hasn't been told. Reading a duel
 * runs this first, so a fight that was solved in another tab (or before the
 * judges settled duels themselves) still ends the moment anyone looks at it.
 */
export async function reconcileDuel<T extends Awaited<ReturnType<typeof loadDuel>>>(duel: T): Promise<T> {
  if (!duel || duel.status !== "active" || !duel.startedAt || duel.winnerTeam != null) return duel;

  const userIds = duel.participants.map((p) => p.userId);
  let winner: { userId: string; passed: number; total: number } | null = null;

  if (duel.kind === "bug" && duel.challengeId) {
    const row = await prisma.bugSubmission.findFirst({
      where: {
        userId: { in: userIds },
        challengeId: duel.challengeId,
        submittedAt: { gte: duel.startedAt },
        verdict: "ACCEPTED",
      },
      orderBy: { submittedAt: "asc" },
      select: { userId: true, passedTests: true, totalTests: true },
    });
    if (row) winner = { userId: row.userId, passed: row.passedTests, total: row.totalTests };
  } else if (duel.problemId) {
    const row = await prisma.submission.findFirst({
      where: {
        userId: { in: userIds },
        problemId: duel.problemId,
        submittedAt: { gte: duel.startedAt },
        verdict: "ACCEPTED",
      },
      orderBy: { submittedAt: "asc" },
      select: { userId: true, passedCases: true, totalCases: true },
    });
    if (row) winner = { userId: row.userId, passed: row.passedCases, total: row.totalCases };
  }

  if (!winner) return duel;

  const settled = await applyDuelResult(duel.id, winner.userId, {
    verdict: "ACCEPTED",
    passed: winner.passed,
    total: winner.total,
  });
  return (settled as T) ?? duel;
}

/**
 * Called by the judges right after they write a submission row: if this user is
 * mid-duel on exactly this problem or hunt, the verdict counts. Never throws —
 * a duel must not be able to fail somebody's submission.
 */
export async function settleDuelForSubmission(
  userId: string,
  target: { problemId?: string | null; challengeId?: string | null },
  result: JudgeResult,
): Promise<void> {
  try {
    const where = target.challengeId
      ? { challengeId: target.challengeId }
      : target.problemId
        ? { problemId: target.problemId }
        : null;
    if (!where) return;

    const duel = await prisma.duel.findFirst({
      where: { ...where, status: "active", participants: { some: { userId } } },
      select: { id: true },
    });
    if (!duel) return;

    await applyDuelResult(duel.id, userId, result);
  } catch (err) {
    console.error("settleDuelForSubmission error:", err);
  }
}
