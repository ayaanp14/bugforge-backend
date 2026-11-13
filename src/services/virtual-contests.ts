/**
 * Virtual contests (lib/virtual-contest): the member's live round, its board
 * and the CP rating it moves.
 *
 * The board is derived: the member's Submission rows on the contest's
 * problems inside its window, mapped to contest verdicts (services/contest
 * VERDICTS) and scored by the Battles engine (contest-rules computeStandings)
 * with the member as the one team and no freeze. A round is finished the
 * first time it is read after its clock (or when ended early): its board,
 * performance and rating are written then, once — `endedAt` is the claim, so
 * two reads racing at the bell settle it once (updateMany where endedAt is null).
 */
import { prisma } from "../lib/prisma.js";
import { getCatalogue, invalidateDashboard } from "./dashboard.js";
import { computeStandings, contestMinute, problemLetter, type StandingRow } from "./contest-rules.js";
import { VERDICTS } from "./contest.js";
import {
  LEVELS,
  problemRating,
  START_RATING,
  isLevel,
  nextRating,
  performance,
  pickProblems,
  ratingTitle,
  type ContestLevel,
} from "../lib/virtual-contest.js";

export class VirtualContestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const HISTORY = 20;
const ME = "me";

type Row = {
  id: string;
  userId: string;
  level: string;
  problemIds: unknown;
  startedAt: Date;
  durationMinutes: number;
  endedAt: Date | null;
  result: unknown;
  performance: number | null;
  ratingBefore: number | null;
  ratingAfter: number | null;
};

const idsOf = (row: Row): string[] => (Array.isArray(row.problemIds) ? (row.problemIds as string[]) : []);
const endOf = (row: Row) => new Date(row.startedAt.getTime() + row.durationMinutes * 60_000);

/** The member's current rating and how many rated rounds made it. */
async function ratingOf(userId: string): Promise<{ rating: number; contests: number }> {
  const [last, contests] = await Promise.all([
    prisma.virtualContest.findFirst({ where: { userId, ratingAfter: { not: null } }, orderBy: { endedAt: "desc" }, select: { ratingAfter: true } }),
    prisma.virtualContest.count({ where: { userId, ratingAfter: { not: null } } }),
  ]);
  return { rating: last?.ratingAfter ?? START_RATING, contests };
}

/** The board row for a round, from the member's submissions inside its window. */
async function boardOf(row: Row, until: Date): Promise<StandingRow> {
  const ids = idsOf(row);
  const subs = await prisma.submission.findMany({
    where: { userId: row.userId, problemId: { in: ids }, submittedAt: { gte: row.startedAt, lt: until }, roomId: null },
    select: { problemId: true, verdict: true, submittedAt: true },
    orderBy: { submittedAt: "asc" },
  });
  const [board] = computeStandings({
    window: { startsAt: row.startedAt, durationMinutes: row.durationMinutes, freezeMinutes: 0 },
    teams: [{ id: ME, name: "You" }],
    problemIds: ids,
    submissions: subs.flatMap((s) => {
      const verdict = VERDICTS[s.verdict];
      return verdict ? [{ teamId: ME, problemId: s.problemId, verdict, at: s.submittedAt }] : [];
    }),
    revealed: true,
  });
  return board!;
}

/** Finish a round whose clock ran out (or that was ended): freeze its board and move the rating. Idempotent. */
async function finish(row: Row, endedAt: Date): Promise<void> {
  const board = await boardOf(row, endedAt);
  const catalogue = await getCatalogue();
  const byId = new Map(catalogue.map((p) => [p.id, p]));
  const ratings = idsOf(row).map((id) => problemRating(byId.get(id)?.difficulty ?? "Medium"));
  const minutes = Math.max(1, Math.min(row.durationMinutes, contestMinute({ startsAt: row.startedAt, durationMinutes: row.durationMinutes, freezeMinutes: 0 }, endedAt)));
  // A round with no attempt on any problem is recorded but unrated: opening a
  // round and ending it at once says nothing about how you solve.
  const attempted = Object.values(board.cells).some((c) => c.attempts > 0 || c.pending > 0);
  const perf = attempted ? performance(ratings, board.solved, board.penalty, minutes) : null;
  const { rating, contests } = await ratingOf(row.userId);
  const after = perf === null ? null : nextRating(rating, perf, contests);
  // The claim: only the read that sets endedAt writes the result.
  const claimed = await prisma.virtualContest.updateMany({
    where: { id: row.id, endedAt: null },
    data: { endedAt, result: { solved: board.solved, penalty: board.penalty, cells: board.cells } as object, performance: perf, ratingBefore: perf === null ? null : rating, ratingAfter: after },
  });
  // A finished round is cp:contests evidence and ticks the mission's contest item.
  if (claimed.count) invalidateDashboard(row.userId);
}

/** The live round, finishing it first when its clock has run out. */
async function liveRound(userId: string): Promise<Row | null> {
  const row = await prisma.virtualContest.findFirst({ where: { userId, endedAt: null }, orderBy: { startedAt: "desc" } });
  if (!row) return null;
  if (Date.now() >= endOf(row).getTime()) {
    await finish(row, endOf(row));
    return null;
  }
  return row;
}

export async function virtualContestHome(userId: string) {
  const live = await liveRound(userId);
  const [{ rating, contests }, history] = await Promise.all([
    ratingOf(userId),
    prisma.virtualContest.findMany({
      where: { userId, endedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      take: HISTORY,
      select: { id: true, level: true, startedAt: true, endedAt: true, result: true, performance: true, ratingBefore: true, ratingAfter: true, problemIds: true },
    }),
  ]);
  return {
    rating: { value: rating, title: ratingTitle(rating), contests },
    levels: (Object.keys(LEVELS) as ContestLevel[]).map((key) => ({ key, label: LEVELS[key].label, problems: LEVELS[key].mix.length, minutes: LEVELS[key].minutes, mix: LEVELS[key].mix })),
    live: live ? { id: live.id, level: live.level, endsAt: endOf(live) } : null,
    history: history.map((h) => {
      const r = (h.result ?? {}) as { solved?: number; penalty?: number };
      return {
        id: h.id,
        level: h.level,
        startedAt: h.startedAt,
        problems: Array.isArray(h.problemIds) ? h.problemIds.length : 0,
        solved: r.solved ?? 0,
        penalty: r.penalty ?? 0,
        performance: h.performance,
        ratingBefore: h.ratingBefore,
        ratingAfter: h.ratingAfter,
      };
    }),
  };
}

export async function startVirtualContest(userId: string, level: unknown): Promise<{ id: string }> {
  if (!isLevel(level)) throw new VirtualContestError("Choose a level: beginner, intermediate or advanced.", 400);
  const live = await liveRound(userId);
  if (live) throw new VirtualContestError("You already have a contest running. Finish it before starting another.", 409);
  const [catalogue, solvedRows] = await Promise.all([
    getCatalogue(),
    prisma.submission.findMany({ where: { userId, verdict: "ACCEPTED" }, distinct: ["problemId"], select: { problemId: true } }),
  ]);
  const solved = new Set(solvedRows.map((s) => s.problemId));
  // The set is dealt from a seed made of the member and the moment, so a retry deals the same problems.
  const seed = `${userId}:${Math.floor(Date.now() / 60_000)}`;
  const set = pickProblems(catalogue, solved, level, seed);
  if (!set) throw new VirtualContestError("The catalogue cannot fill a contest at this level right now.", 503);
  const row = await prisma.virtualContest.create({
    data: { userId, level, problemIds: set.map((p) => p.id), durationMinutes: LEVELS[level].minutes },
    select: { id: true },
  });
  return row;
}

export async function virtualContest(userId: string, id: string) {
  const found = await prisma.virtualContest.findFirst({ where: { id, userId } });
  // Someone else's or unknown: the same answer.
  if (!found) throw new VirtualContestError("That contest was not found.", 404);
  let row: Row = found;
  if (!row.endedAt && Date.now() >= endOf(row).getTime()) {
    await finish(row, endOf(row));
    row = (await prisma.virtualContest.findUnique({ where: { id } }))!;
  }
  const catalogue = await getCatalogue();
  const byId = new Map(catalogue.map((p) => [p.id, p]));
  const board = row.endedAt ? ((row.result ?? { solved: 0, penalty: 0, cells: {} }) as Pick<StandingRow, "solved" | "penalty" | "cells">) : await boardOf(row, new Date());
  return {
    id: row.id,
    level: row.level,
    levelLabel: isLevel(row.level) ? LEVELS[row.level].label : row.level,
    startedAt: row.startedAt,
    endsAt: endOf(row),
    endedAt: row.endedAt,
    durationMinutes: row.durationMinutes,
    problems: idsOf(row).map((pid, i) => {
      const p = byId.get(pid);
      const cell = board.cells[pid];
      return {
        letter: problemLetter(i),
        slug: p?.slug ?? null,
        title: p?.title ?? "Unpublished problem",
        difficulty: p?.difficulty ?? "Medium",
        attempts: cell?.attempts ?? 0,
        solvedAt: cell?.solvedAt ?? null,
      };
    }),
    solved: board.solved,
    penalty: board.penalty,
    performance: row.performance,
    ratingBefore: row.ratingBefore,
    ratingAfter: row.ratingAfter,
  };
}

/** End a live round early: what is solved stands, the rating moves on it. */
export async function endVirtualContest(userId: string, id: string) {
  const row = await prisma.virtualContest.findFirst({ where: { id, userId } });
  if (!row) throw new VirtualContestError("That contest was not found.", 404);
  if (!row.endedAt) await finish(row, new Date(Math.min(Date.now(), endOf(row).getTime())));
  return virtualContest(userId, id);
}
