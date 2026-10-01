/**
 * The daily contest's XP, paid when the day closes.
 *
 * Every solve on the contest day is worth CONTEST_SOLVE_XP, and the day's two
 * fastest solvers — the board's own order: penalised time, then whoever
 * finished first — get CONTEST_PODIUM_XP on top. None of it can be paid at
 * the accepted submit: first place is only known once nobody else can enter,
 * and someone who opens the problem at 23:00 and finishes in four minutes
 * beats everyone who sat it at breakfast. So the job below runs when the UTC
 * day rolls over — the moment the next problem is assigned — and settles the
 * day that just closed, with a notification telling each solver what they
 * were paid and why.
 *
 * Paid once. `DailyContestEntry.rewardXp` is written in the same transaction
 * as the User increment and only over a null, so a second run — "Run now" in
 * the admin panel, or another instance — pays nothing twice.
 * `DailyContest.settledAt` marks a day whose solvers are all paid and told; a
 * run settles every closed day still unmarked, oldest first, so a run that
 * failed or a process that was down at midnight is caught up by the next one.
 *
 * The XP goes to `xp` (the leaderboard and the profile total) and `rating`
 * (the rank bar), the way a first solve and a roadmap chest pay both — not
 * the per-source buckets, which are what solves and fixes themselves pay.
 * Points and standings are untouched: the contest keeps its own ladder, and
 * this is XP beside it.
 */
import { prisma } from "../lib/prisma.js";
import type { Job } from "../lib/scheduler.js";
import { invalidateDashboard } from "./dashboard.js";
import { createNotificationsOnce } from "./notifications.js";
import { dayOf, ensureContest } from "./daily-contest.js";

export const CONTEST_SOLVE_XP = 20;
/** On top of the solve: first place, then second place, on the day's board. */
export const CONTEST_PODIUM_XP: readonly number[] = [15, 10];

/**
 * The first contest day that pays. The days before it were sat under "the
 * contest pays no XP", and settling them all on the first run would put
 * months of back pay on the leaderboard overnight.
 */
export const CONTEST_XP_FROM = "2026-10-01";

/**
 * How long after midnight UTC a day counts as closed. A submission is stamped
 * before the contest hears of it (routes/execution.ts), so an accept made at
 * 23:59:59 can still be landing on the board a moment after midnight; the
 * payout waits until it has.
 */
const SETTLE_GRACE_MS = 2 * 60_000;
/** Rows per statement: keeps the IN() lists and each transaction small. */
const BATCH = 200;
/** Closed days one run settles; anything beyond is a backlog the next run finishes. */
const MAX_DAYS_PER_RUN = 14;

/* ── the rule ──────────────────────────────────────────────────────── */

/** What a solver at this rank (1-based) on the day's board is paid. */
export function contestRewardXp(rank: number): number {
  return CONTEST_SOLVE_XP + (CONTEST_PODIUM_XP[rank - 1] ?? 0);
}

export interface Payout {
  entryId: string;
  userId: string;
  rank: number;
  xp: number;
  /** Already paid by an earlier run; only the notification may still be owed. */
  paid: boolean;
}

/**
 * The day's payouts from its solvers in board order. A row already paid keeps
 * the amount it was paid — its notification must say what it actually got.
 */
export function dayPayouts(solvers: ReadonlyArray<{ id: string; userId: string; rewardXp: number | null }>): Payout[] {
  return solvers.map((s, i) => ({
    entryId: s.id,
    userId: s.userId,
    rank: i + 1,
    xp: s.rewardXp ?? contestRewardXp(i + 1),
    paid: s.rewardXp !== null,
  }));
}

/**
 * Due from SETTLE_GRACE after midnight UTC for the rest of the UTC day, keyed
 * by the day that just opened: the first tick of a new contest day settles
 * the one before it. The window is the whole day so a process that was down
 * at midnight still pays when it comes back.
 */
export function contestPayoutPeriod(now: Date): string | null {
  const day = dayOf(now);
  return now.getTime() - Date.parse(day + "T00:00:00Z") >= SETTLE_GRACE_MS ? day : null;
}

/* ── the copy ──────────────────────────────────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "1 Oct" — the contest day as the notification names it. */
export function contestDayLabel(date: string): string {
  return `${Number(date.slice(8, 10))} ${MONTHS[Number(date.slice(5, 7)) - 1]}`;
}

/** The notification a paid solver gets: what they were paid, and what for. */
export function contestRewardNotice(input: { date: string; problem: string; rank: number; solvers: number; xp: number }) {
  const day = contestDayLabel(input.date);
  const bonus = input.xp - CONTEST_SOLVE_XP;
  const solve = `${CONTEST_SOLVE_XP} XP for solving it`;
  // The day's own board, which is where "fastest" can be checked.
  const href = `/contests?date=${input.date}`;
  if (input.rank === 1 && bonus > 0) {
    return {
      title: `Fastest on ${day}'s problem 🥇 +${input.xp} XP`,
      body:
        input.solvers === 1
          ? `You were the only one to solve ${input.problem} on ${day}: ${solve} and ${bonus} for first place. Today's problem is open.`
          : `Nobody solved ${input.problem} faster on ${day} — first of ${input.solvers}: ${solve} and ${bonus} for first place. Today's problem is open; come and defend it.`,
      href,
    };
  }
  if (input.rank === 2 && bonus > 0) {
    return {
      title: `Second fastest on ${day}'s problem 🥈 +${input.xp} XP`,
      body: `Only one solver beat you on ${input.problem} on ${day} — second of ${input.solvers}: ${solve} and ${bonus} for second place. Today's problem is open, and first place pays ${CONTEST_PODIUM_XP[0]} more.`,
      href,
    };
  }
  return {
    title: `Daily contest solved ✅ +${input.xp} XP`,
    body: `You solved ${input.problem} on ${day} and finished #${input.rank} of ${input.solvers}: ${solve}. The day's two fastest solvers get ${CONTEST_PODIUM_XP[0]} and ${CONTEST_PODIUM_XP[1]} more — today's problem is open.`,
    href,
  };
}

/* ── the payout ────────────────────────────────────────────────────── */

interface ClosedDay {
  id: string;
  date: string;
  problem: { title: string };
}

async function settleDay(day: ClosedDay) {
  const solvers = await prisma.dailyContestEntry.findMany({
    where: { contestId: day.id, solvedAt: { not: null } },
    // The board's order (dayBoard), with the id as the last word so a re-run
    // ranks an exact tie the same way.
    orderBy: [{ penaltySec: "asc" }, { solvedAt: "asc" }, { id: "asc" }],
    select: { id: true, userId: true, rewardXp: true },
  });
  const payouts = dayPayouts(solvers);

  // Owed rows grouped by amount — at most three amounts, so a board of any
  // size is a handful of statements rather than a transaction per solver.
  const owed = new Map<number, Payout[]>();
  for (const p of payouts) {
    if (p.paid) continue;
    const group = owed.get(p.xp);
    if (group) group.push(p);
    else owed.set(p.xp, [p]);
  }

  const newlyPaid: string[] = [];
  let paidXp = 0;
  for (const [xp, rows] of owed) {
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      await prisma.$transaction(async (tx) => {
        const stamped = await tx.dailyContestEntry.updateMany({
          where: { id: { in: chunk.map((p) => p.entryId) }, rewardXp: null },
          data: { rewardXp: xp },
        });
        // Fewer stamped than read means another run paid some of these since
        // the read (or an account was deleted). Roll the chunk back rather
        // than guess which; the next run reads afresh.
        if (stamped.count !== chunk.length) {
          throw new Error(`${chunk.length - stamped.count} of ${chunk.length} entries changed under the payout`);
        }
        // One entry per user per day, so every id here is incremented once.
        await tx.user.updateMany({
          where: { id: { in: chunk.map((p) => p.userId) } },
          data: { xp: { increment: xp }, rating: { increment: xp } },
        });
      });
      for (const p of chunk) newlyPaid.push(p.userId);
      paidXp += xp * chunk.length;
    }
  }
  // The home hero, the profile and /api/me read XP from cached aggregates.
  for (const userId of newlyPaid) invalidateDashboard(userId);

  // Told after paid, deduped by the dated type, and every solver of the day
  // rather than only the ones this run paid — so a run that died between
  // paying and telling still sends the rest.
  const type = `daily_contest_xp_${day.date}`;
  let notified = 0;
  for (let i = 0; i < payouts.length; i += BATCH) {
    const chunk = payouts.slice(i, i + BATCH);
    const fresh = await createNotificationsOnce(
      type,
      chunk.map((p) => ({
        userId: p.userId,
        ...contestRewardNotice({ date: day.date, problem: day.problem.title, rank: p.rank, solvers: payouts.length, xp: p.xp }),
      })),
    );
    notified += fresh.length;
  }

  await prisma.dailyContest.update({ where: { id: day.id }, data: { settledAt: new Date() } });
  return { date: day.date, solvers: payouts.length, paid: newlyPaid.length, xp: paidXp, notified };
}

/**
 * Settle every closed, unpaid day from CONTEST_XP_FROM on. Exported for the
 * job and for a script that needs to settle by hand; safe to call any number
 * of times.
 */
export async function settleClosedContests(now = new Date()) {
  const closedBefore = dayOf(new Date(now.getTime() - SETTLE_GRACE_MS));
  const days = await prisma.dailyContest.findMany({
    where: { date: { gte: CONTEST_XP_FROM, lt: closedBefore }, settledAt: null },
    orderBy: { date: "asc" },
    take: MAX_DAYS_PER_RUN,
    select: { id: true, date: true, problem: { select: { title: true } } },
  });
  const settled: Array<Awaited<ReturnType<typeof settleDay>>> = [];
  const failed: Array<{ date: string; error: string }> = [];
  for (const day of days) {
    try {
      settled.push(await settleDay(day));
    } catch (err) {
      failed.push({ date: day.date, error: (err as Error).message });
    }
  }
  return { settled, failed };
}

export const contestPayoutJob: Job = {
  name: "daily_contest_xp",
  description:
    "When the UTC contest day rolls (05:30 IST): assigns the new day's problem and pays the day that closed — 20 XP a solve, +15 / +10 to the two fastest — with a notification to each. Catches up any closed day left unpaid.",
  periodOf: contestPayoutPeriod,
  async run(now) {
    // The day turning over is both halves: the new problem is assigned (if no
    // visitor or index.ts's timer has yet — ensureContest is idempotent) and
    // the old one is judged.
    const opened = await ensureContest(dayOf(now)).catch((err) => {
      console.error("daily contest payout — assigning today's problem failed:", err);
      return null;
    });
    const { settled, failed } = await settleClosedContests(now);
    // Thrown so the run row in the admin panel shows it. The days still
    // unmarked are retried by the next run, or by "Run now".
    if (failed.length > 0) {
      const done = settled.map((s) => s.date).join(", ") || "none";
      throw new Error(`payout failed for ${failed.map((f) => `${f.date} (${f.error})`).join("; ")}; settled: ${done}`);
    }
    return { opened: opened?.date ?? null, settled };
  },
};
