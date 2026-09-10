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
import { invalidateDashboard } from "../services/dashboard.js";

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

/* ── the duel row, briefly remembered ─────────────────────────────── */

/**
 * Every participant's room polls the duel every few seconds, and both sides
 * poll the same row. Two seconds is shorter than any poll interval, so a
 * reader never sees anything older than it would have between two of its own
 * ticks — while two warriors polling in step share one query instead of two.
 *
 * Every writer in this file and in routes/duels.ts calls `forgetDuel` after
 * its update, and takes `fresh` when it is about to decide something on what
 * it reads: a cached copy is fine to show, not to settle a fight on.
 */
const DUEL_CACHE_TTL_MS = 2_000;
type LoadedDuel = Awaited<ReturnType<typeof loadDuelFresh>>;
const duelCache = new Map<string, { value: LoadedDuel; expiresAt: number }>();
const duelInFlight = new Map<string, Promise<LoadedDuel>>();

function loadDuelFresh(id: string) {
  return prisma.duel.findUnique({ where: { id }, include: DUEL_INCLUDE });
}

export async function loadDuel(id: string, fresh = false): Promise<LoadedDuel> {
  if (!fresh) {
    const hit = duelCache.get(id);
    if (hit && hit.expiresAt > Date.now()) return hit.value;
    const pending = duelInFlight.get(id);
    if (pending) return pending;
  }
  const promise = loadDuelFresh(id)
    .then((duel) => {
      duelCache.set(id, { value: duel, expiresAt: Date.now() + DUEL_CACHE_TTL_MS });
      return duel;
    })
    .finally(() => duelInFlight.delete(id));
  duelInFlight.set(id, promise);
  return promise;
}

/** Call after any write to a duel or its participants. */
export function forgetDuel(id: string): void {
  duelCache.delete(id);
  duelInFlight.delete(id);
}

/* ── who might be mid-duel ────────────────────────────────────────── */

/**
 * The judges ask "is this user in a live duel on this target?" on every Run
 * (twice: reaching for the button, and how it went) and every Submit — for
 * every user on the platform, nearly all of whom have never duelled. That is
 * a findFirst across three tables, ~500 ms away, spent almost entirely on
 * answering "no".
 *
 * Two memories avoid it. The duel routes mark a user the moment they queue,
 * join or get matched, and clear them when the duel ends — a user this
 * process has marked is always asked about. Anyone else is asked once, and a
 * "no" for that user *and that target* is remembered for 30 seconds: keyed by
 * target, because being in a duel on one problem says nothing about the one
 * open in the next tab, and a settlement must never be skipped on a guess.
 *
 * Both are per process. A duel started on another instance simply costs one
 * query on the first Run here, which then marks the user like any other.
 */
export type DuelTarget = { problemId?: string | null; challengeId?: string | null };

const IN_DUEL_TTL_MS = 3 * 60 * 60_000;
const NOT_IN_DUEL_TTL_MS = 30_000;
const activeDuelUsers = new Map<string, number>();
const notInDuel = new Map<string, Map<string, number>>();

const targetKey = (target: DuelTarget): string | null =>
  target.challengeId ? `challenge:${target.challengeId}` : target.problemId ? `problem:${target.problemId}` : null;

/** This user is queued, seated or fighting: always ask the database about them. */
export function markUserInDuel(userId: string): void {
  activeDuelUsers.set(userId, Date.now() + IN_DUEL_TTL_MS);
  notInDuel.delete(userId);
}

/** The duel is over (or they left the queue): back to the cheap path. */
export function clearUserInDuel(userId: string): void {
  activeDuelUsers.delete(userId);
}

/**
 * False only when this process knows the user is not in a duel on that
 * target — or, with no target, not in any duel it has recently asked about.
 * True means "ask": nothing is known, or they are marked.
 */
export function mayBeInDuel(userId: string, target?: DuelTarget): boolean {
  const marked = activeDuelUsers.get(userId);
  if (marked !== undefined) {
    if (marked > Date.now()) return true;
    activeDuelUsers.delete(userId);
  }
  const misses = notInDuel.get(userId);
  if (!misses) return true;
  const key = target ? targetKey(target) : null;
  if (key === null) return true;
  const until = misses.get(key);
  if (until === undefined) return true;
  if (until > Date.now()) return false;
  misses.delete(key);
  if (misses.size === 0) notInDuel.delete(userId);
  return true;
}

function rememberNotInDuel(userId: string, target: DuelTarget): void {
  const key = targetKey(target);
  if (key === null) return;
  const misses = notInDuel.get(userId) ?? new Map<string, number>();
  misses.set(key, Date.now() + NOT_IN_DUEL_TTL_MS);
  notInDuel.set(userId, misses);
}

/**
 * The live duel this user is fighting on exactly this problem or hunt, or
 * null. Gated by the tracker above, so for almost everyone it costs nothing.
 */
export async function findLiveDuelFor(userId: string, target: DuelTarget): Promise<{ id: string } | null> {
  const where = target.challengeId
    ? { challengeId: target.challengeId }
    : target.problemId
      ? { problemId: target.problemId }
      : null;
  if (!where) return null;
  if (!mayBeInDuel(userId, target)) return null;

  const duel = await prisma.duel.findFirst({
    where: { ...where, status: "active", participants: { some: { userId } } },
    select: { id: true },
  });
  if (duel) markUserInDuel(userId);
  else rememberNotInDuel(userId, target);
  return duel;
}

/* ── settlement ───────────────────────────────────────────────────── */

export type JudgeResult = { verdict: string; passed: number; total: number };

/**
 * Record one warrior's verdict against a live duel and, if it is the first
 * accepted one, end the duel and pay everyone out. Returns the duel as it now
 * stands, or null when there was nothing to apply.
 *
 * A caller that has just loaded the duel may pass it in to save the re-read;
 * nothing is decided on that copy that the database does not confirm — the
 * win is claimed with a guarded update, so two accepted submissions landing
 * together pay out exactly once.
 */
export async function applyDuelResult(
  duelId: string,
  userId: string,
  result: JudgeResult,
  preloaded?: LoadedDuel,
): Promise<LoadedDuel | null> {
  const duel = preloaded ?? (await loadDuel(duelId, true));
  if (!duel || duel.status !== "active" || !duel.startedAt) return duel ?? null;

  const me = duel.participants.find((p) => p.userId === userId);
  if (!me) return duel;

  const solved = result.verdict.toUpperCase() === "ACCEPTED";
  const scoreboard = prisma.duelParticipant.update({
    where: { id: me.id },
    data: {
      passed: result.passed,
      total: result.total,
      verdict: result.verdict,
      ...(solved ? { finishedAt: new Date() } : {}),
    },
  });

  if (!solved || duel.winnerTeam != null) {
    await scoreboard;
    forgetDuel(duelId);
    const progressed = await loadDuel(duelId, true);
    emitToRoom(duelRoom(duelId), "duel-update", progressed);
    return progressed;
  }

  // First accepted submission ends it for everyone. The claim is guarded on
  // the row itself, not on the copy read above, so only one of two
  // simultaneous solvers gets to pay out.
  const [, claim] = await Promise.all([
    scoreboard,
    prisma.duel.updateMany({
      where: { id: duelId, status: "active", winnerTeam: null },
      data: { status: "finished", endedAt: new Date(), winnerTeam: me.team },
    }),
  ]);
  forgetDuel(duelId);

  if (claim.count === 0) {
    // Somebody else's accepted submission got there first; theirs paid out.
    const settled = await loadDuel(duelId, true);
    emitToRoom(duelRoom(duelId), "duel-finished", settled);
    return settled;
  }

  const prize = winXp(duel.problem?.difficulty ?? duel.challenge?.difficulty);
  const consolation = Math.round(prize * 0.25);
  const winners = duel.participants.filter((p) => p.team === me.team).map((p) => p.userId);
  const losers = duel.participants.filter((p) => p.team !== me.team).map((p) => p.userId);

  // One statement per team per table, all independent, rather than two
  // updates per warrior in a row (eleven round trips for a 2v2).
  await Promise.all([
    prisma.duelParticipant.updateMany({ where: { duelId, team: me.team }, data: { xpAwarded: prize } }),
    prisma.duelParticipant.updateMany({ where: { duelId, team: { not: me.team } }, data: { xpAwarded: consolation } }),
    prisma.user.updateMany({
      where: { id: { in: winners } },
      data: { xp: { increment: prize }, rating: { increment: Math.round(prize / 3) } },
    }),
    losers.length
      ? prisma.user.updateMany({ where: { id: { in: losers } }, data: { xp: { increment: consolation } } })
      : Promise.resolve(),
  ]);
  forgetDuel(duelId);

  // Everyone's XP just moved, and the dashboard header is cached.
  for (const p of duel.participants) {
    invalidateDashboard(p.userId);
    clearUserInDuel(p.userId);
  }

  const finished = await loadDuel(duelId, true);
  emitToRoom(duelRoom(duelId), "duel-finished", finished);
  return finished;
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
  target: DuelTarget,
  activity: { type: "running" | "ran" | "submitting"; passed?: number; total?: number },
): Promise<void> {
  try {
    const duel = await findLiveDuelFor(userId, target);
    if (!duel) return;

    emitToRoom(duelRoom(duel.id), "duel-activity", { duelId: duel.id, userId, ...activity, at: Date.now() });
  } catch (err) {
    console.error("emitDuelActivity error:", err);
  }
}

/**
 * How long a duel may sit unfought before it is treated as abandoned.
 *
 * A waiting duel had no expiry at all, and nothing closes one when a tab is
 * shut — so a queue entry or an unused room stayed "waiting" forever. That is
 * not merely untidy: /queue refuses to double-book, so it hands the old duel
 * back instead of matchmaking, and its owner is quietly locked out of duelling
 * with no way to find out why. One was found three days old.
 *
 * A public entry is a matchmaking attempt and dies quickly — it is also what
 * another player would otherwise be matched into, landing them in a fight
 * against somebody who closed the tab twenty minutes ago. A private room is a
 * code shared with a friend, so it is given the afternoon.
 */
const WAITING_TTL_MS = {
  public: Number(process.env.DUEL_QUEUE_TTL_MS ?? 20 * 60_000),
  private: Number(process.env.DUEL_ROOM_TTL_MS ?? 2 * 60 * 60_000),
};

/** The cut-off a still-joinable public duel must have been created after. */
export function freshPublicSince() {
  return new Date(Date.now() - WAITING_TTL_MS.public);
}

function isStaleWaiting(duel: { status: string; visibility: string; createdAt: Date } | null) {
  if (!duel || duel.status !== "waiting") return false;
  const ttl = duel.visibility === "private" ? WAITING_TTL_MS.private : WAITING_TTL_MS.public;
  return Date.now() - new Date(duel.createdAt).getTime() > ttl;
}

/**
 * Closes a waiting duel nobody came back to, and reports it as no longer live.
 *
 * Lazily, on read, in the same spirit as `reconcileDuel` — a duel nobody looks
 * at harms nobody, and the moment anyone does look, it stops standing in the
 * way. That also means no sweeper to schedule and no cron to forget.
 */
export async function expireIfStale<T extends LoadedDuel>(duel: T): Promise<T | null> {
  if (!isStaleWaiting(duel)) return duel;
  try {
    await prisma.duel.update({
      where: { id: duel!.id },
      data: { status: "cancelled", endedAt: new Date() },
    });
  } catch (err) {
    // Losing this race is fine: somebody else closed or joined it first.
    console.error("expireIfStale error:", (err as Error).message);
  }
  forgetDuel(duel!.id);
  for (const p of duel!.participants) clearUserInDuel(p.userId);
  return null;
}

/**
 * Self-healing: an active duel whose target already has an accepted submission
 * from one of its warriors is over — it just hasn't been told. Reading a duel
 * runs this first, so a fight that was solved in another tab (or before the
 * judges settled duels themselves) still ends the moment anyone looks at it.
 */
export async function reconcileDuel<T extends LoadedDuel>(duel: T): Promise<T> {
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
  target: DuelTarget,
  result: JudgeResult,
): Promise<void> {
  try {
    const duel = await findLiveDuelFor(userId, target);
    if (!duel) return;

    await applyDuelResult(duel.id, userId, result);
  } catch (err) {
    console.error("settleDuelForSubmission error:", err);
  }
}
