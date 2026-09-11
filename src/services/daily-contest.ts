/**
 * The daily contest: one problem a day, ranked the way a contest ranks.
 *
 * Modelled on LeetCode's daily challenge and its contest scoring. Every UTC
 * day has one problem; the clock for a user starts when they open the
 * workspace on that day and stops at their first accepted submission, and
 * each rejected submission before it costs five minutes — so the day's board
 * orders solvers by `timeTakenSec + 300 × wrongAttempts`. A solve is worth
 * 3 / 4 / 5 points by difficulty, and the month's standings sum those.
 * Streaks count consecutive days solved, which is what the calendar draws.
 *
 * None of this touches XP or the leaderboard: the contest is its own
 * ladder, on purpose.
 */
import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/cache.js";
import { getCatalogue } from "./dashboard.js";

const DAY_MS = 86_400_000;

/** Sunday first. Easy to start the week, hard at the weekend, like the real thing. */
const DIFFICULTY_BY_WEEKDAY = ["hard", "easy", "medium", "easy", "medium", "medium", "hard"] as const;
const POINTS: Record<string, number> = { easy: 3, medium: 4, hard: 5 };
const WRONG_PENALTY_SEC = 300;
/** A problem is not offered again for this long. */
const REUSE_AFTER_DAYS = 365;

export const CONTEST_PROBLEM_SELECT = {
  id: true,
  slug: true,
  title: true,
  difficulty: true,
  tags: true,
} as const;

const RANKED_USER_SELECT = { id: true, name: true, username: true, avatar_url: true, xp: true } as const;

/* ── dates ─────────────────────────────────────────────────────────── */

/** "YYYY-MM-DD" of an instant, in UTC — the contest day everywhere. */
export function dayOf(at: Date): string {
  return at.toISOString().slice(0, 10);
}

export function todayUtc(): string {
  return dayOf(new Date());
}

export function isValidDay(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date + "T00:00:00Z"));
}

export function addDays(date: string, days: number): string {
  return dayOf(new Date(Date.parse(date + "T00:00:00Z") + days * DAY_MS));
}

/** When the day's contest closes: midnight UTC after it. */
export function endOfDay(date: string): Date {
  return new Date(Date.parse(date + "T00:00:00Z") + DAY_MS);
}

export function weekdayDifficulty(date: string): (typeof DIFFICULTY_BY_WEEKDAY)[number] {
  return DIFFICULTY_BY_WEEKDAY[new Date(date + "T00:00:00Z").getUTCDay()];
}

/* ── the day's problem ─────────────────────────────────────────────── */

/** FNV-1a over the date: the same day picks the same problem on every instance. */
function hashDay(date: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < date.length; i++) h = Math.imul(h ^ date.charCodeAt(i), 16777619) >>> 0;
  return h;
}

const contestKey = (date: string) => `contest:daily:${date}`;

type ContestRow = NonNullable<Awaited<ReturnType<typeof findContest>>>;

function findContest(date: string) {
  return prisma.dailyContest.findUnique({
    where: { date },
    select: { id: true, date: true, difficulty: true, problemId: true, problem: { select: CONTEST_PROBLEM_SELECT } },
  });
}

/**
 * The contest for a day, created on first request. Only today and the past
 * are ever materialised — a future day's problem stays unknown until the day
 * comes, so nobody can prepare for it, though its difficulty is public (it is
 * a function of the weekday).
 */
export async function ensureContest(date: string): Promise<ContestRow | null> {
  if (date > todayUtc()) return null;
  return cached(contestKey(date), 60_000, async () => {
    const existing = await findContest(date);
    if (existing) return existing;

    const [catalogue, recent] = await Promise.all([
      getCatalogue(),
      prisma.dailyContest.findMany({
        where: { date: { gte: addDays(date, -REUSE_AFTER_DAYS) } },
        select: { problemId: true },
      }),
    ]);
    const used = new Set(recent.map((r) => r.problemId));
    const wanted = weekdayDifficulty(date);
    // Sorted by id so the hash lands on the same problem whatever order the
    // catalogue query returned; fall back to any unused problem, then to any.
    let pool = catalogue.filter((p) => p.difficulty.toLowerCase() === wanted && !used.has(p.id));
    if (pool.length === 0) pool = catalogue.filter((p) => !used.has(p.id));
    if (pool.length === 0) pool = [...catalogue];
    if (pool.length === 0) return null;
    pool.sort((a, b) => (a.id < b.id ? -1 : 1));
    const pick = pool[hashDay(date) % pool.length];

    try {
      await prisma.dailyContest.create({ data: { date, problemId: pick.id, difficulty: pick.difficulty.toLowerCase() } });
    } catch {
      // Another instance created it a moment ago; read theirs.
    }
    return findContest(date);
  });
}

/** Today's contest, for the submit path: one cached read, no creation cost after the first. */
export function todayContest() {
  return ensureContest(todayUtc());
}

/* ── the user's sitting ────────────────────────────────────────────── */

export const ENTRY_SELECT = {
  id: true,
  startedAt: true,
  solvedAt: true,
  timeTakenSec: true,
  wrongAttempts: true,
  penaltySec: true,
  points: true,
} as const;

/** Opening the workspace on the contest day is entering the contest. Idempotent. */
export async function enterContest(userId: string, contest: ContestRow) {
  const key = { contestId: contest.id, userId };
  const existing = await prisma.dailyContestEntry.findUnique({ where: { contestId_userId: key }, select: ENTRY_SELECT });
  if (existing) return existing;
  try {
    const created = await prisma.dailyContestEntry.create({
      data: { ...key, date: contest.date },
      select: ENTRY_SELECT,
    });
    invalidate(boardKey(contest.id));
    return created;
  } catch {
    // Two tabs opened at once; the unique kept one, return it.
    return prisma.dailyContestEntry.findUnique({ where: { contestId_userId: key }, select: ENTRY_SELECT });
  }
}

/**
 * Whether the reader solved this problem on an earlier day, in the problem
 * catalogue. It earns nothing here — the contest counts only an accepted
 * submission made on the contest day, after entering — but the card says so
 * rather than letting them wonder why the old tick did not carry over.
 */
export async function solvedBeforeDay(userId: string, problemId: string, date: string): Promise<boolean> {
  const earlier = await prisma.submission.findFirst({
    where: { userId, problemId, verdict: "ACCEPTED", submittedAt: { lt: new Date(date + "T00:00:00Z") } },
    select: { id: true },
  });
  return earlier !== null;
}

/** Rank on the day's board: solvers ahead of this penalty, plus one. */
async function rankOf(contestId: string, penaltySec: number, solvedAt: Date): Promise<number> {
  const ahead = await prisma.dailyContestEntry.count({
    where: {
      contestId,
      solvedAt: { not: null },
      OR: [{ penaltySec: { lt: penaltySec } }, { penaltySec, solvedAt: { lt: solvedAt } }],
    },
  });
  return ahead + 1;
}

export interface ContestSubmissionOutcome {
  date: string;
  solved: boolean;
  timeTakenSec: number | null;
  wrongAttempts: number;
  rank: number | null;
  points: number;
}

/**
 * Called by the judge for every problem submission. Cheap unless the problem
 * is today's problem and the user has entered: then a solve closes the entry
 * and a miss adds to its penalty. Returns what the workspace shows, or null
 * when the submission had nothing to do with the contest.
 */
export async function recordContestSubmission(
  userId: string,
  problemId: string,
  verdict: string,
  at: Date,
): Promise<ContestSubmissionOutcome | null> {
  const contest = await todayContest();
  if (!contest || contest.problemId !== problemId) return null;
  // Only a verdict from the contest day counts — never an older solve of the
  // same problem carried over, and not a submission that lands after midnight.
  if (dayOf(at) !== contest.date) return null;
  const key = { contestId: contest.id, userId };
  const entry = await prisma.dailyContestEntry.findUnique({ where: { contestId_userId: key }, select: ENTRY_SELECT });
  if (!entry) return null;

  if (entry.solvedAt) {
    // Already on the board; later submissions neither help nor hurt.
    return {
      date: contest.date,
      solved: true,
      timeTakenSec: entry.timeTakenSec,
      wrongAttempts: entry.wrongAttempts ?? 0,
      rank: await rankOf(contest.id, entry.penaltySec ?? 0, entry.solvedAt),
      points: entry.points ?? 0,
    };
  }

  if (verdict !== "ACCEPTED") {
    // A build failure never ran against a case, so it says nothing about the
    // answer; charging five minutes for a missing semicolon is not what the
    // penalty is for (and no contest platform does). Wrong answers, crashes
    // and timeouts still count.
    if (verdict === "COMPILATION_ERROR") {
      return { date: contest.date, solved: false, timeTakenSec: null, wrongAttempts: entry.wrongAttempts ?? 0, rank: null, points: 0 };
    }
    const bumped = await prisma.dailyContestEntry.update({
      where: { contestId_userId: key },
      data: { wrongAttempts: { increment: 1 } },
      select: { wrongAttempts: true },
    });
    return { date: contest.date, solved: false, timeTakenSec: null, wrongAttempts: bumped.wrongAttempts, rank: null, points: 0 };
  }

  const timeTakenSec = Math.max(0, Math.round((at.getTime() - entry.startedAt.getTime()) / 1000));
  const wrongAttempts = entry.wrongAttempts ?? 0;
  const penaltySec = timeTakenSec + WRONG_PENALTY_SEC * wrongAttempts;
  const points = POINTS[contest.difficulty] ?? 3;
  await prisma.dailyContestEntry.update({
    where: { contestId_userId: key },
    data: { solvedAt: at, timeTakenSec, penaltySec, points },
  });
  invalidate(boardKey(contest.id));
  invalidate(standingsKey("month", contest.date.slice(0, 7)));
  invalidate(standingsKey("all"));
  return {
    date: contest.date,
    solved: true,
    timeTakenSec,
    wrongAttempts,
    rank: await rankOf(contest.id, penaltySec, at),
    points,
  };
}

/* ── streaks ───────────────────────────────────────────────────────── */

export interface ContestStreak {
  current: number;
  longest: number;
  solvedToday: boolean;
  /** Days solved, ever. */
  solved: number;
}

/**
 * Consecutive solved days ending today or yesterday. Derived from the rows
 * each time rather than kept as a counter — a counter drifts the first time
 * a write is missed, and a user has at most one row a day.
 */
export async function contestStreak(userId: string, today = todayUtc()): Promise<ContestStreak> {
  const rows = await prisma.dailyContestEntry.findMany({
    where: { userId, solvedAt: { not: null } },
    select: { date: true },
    orderBy: { date: "desc" },
  });
  const days = rows.map((r) => r.date);
  const solvedToday = days[0] === today;

  let longest = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && addDays(days[i - 1], -1) === days[i] ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // The current run must reach today or yesterday; older than that, it is over.
  let current = 0;
  if (days.length > 0 && (days[0] === today || days[0] === addDays(today, -1))) {
    current = 1;
    for (let i = 1; i < days.length && addDays(days[i - 1], -1) === days[i]; i++) current += 1;
  }
  return { current, longest, solvedToday, solved: days.length };
}

/* ── boards ────────────────────────────────────────────────────────── */

const boardKey = (contestId: string) => `contest:board:${contestId}`;

export interface BoardRow {
  rank: number;
  user: { id: string; name: string | null; username: string | null; avatar_url: string | null; xp: number };
  timeTakenSec: number;
  wrongAttempts: number;
  penaltySec: number;
  solvedAt: Date;
}

/** The day's solvers, fastest (after penalties) first, plus how many sat and solved. */
export async function dayBoard(contestId: string, limit = 50) {
  return cached(boardKey(contestId), 15_000, async () => {
    const [rows, participants, solvers] = await Promise.all([
      prisma.dailyContestEntry.findMany({
        where: { contestId, solvedAt: { not: null } },
        orderBy: [{ penaltySec: "asc" }, { solvedAt: "asc" }],
        take: limit,
        select: { userId: true, timeTakenSec: true, wrongAttempts: true, penaltySec: true, solvedAt: true, user: { select: RANKED_USER_SELECT } },
      }),
      prisma.dailyContestEntry.count({ where: { contestId } }),
      prisma.dailyContestEntry.count({ where: { contestId, solvedAt: { not: null } } }),
    ]);
    const board: BoardRow[] = rows.map((r, i) => ({
      rank: i + 1,
      user: r.user,
      timeTakenSec: r.timeTakenSec ?? 0,
      wrongAttempts: r.wrongAttempts,
      penaltySec: r.penaltySec ?? 0,
      solvedAt: r.solvedAt as Date,
    }));
    return { board, participants, solvers };
  });
}

/** The reader's own line on a day: rank among solvers, or just their sitting. */
export async function myDayStanding(contestId: string, userId: string) {
  const entry = await prisma.dailyContestEntry.findUnique({ where: { contestId_userId: { contestId, userId } }, select: ENTRY_SELECT });
  if (!entry) return null;
  const rank = entry.solvedAt ? await rankOf(contestId, entry.penaltySec ?? 0, entry.solvedAt) : null;
  return { ...entry, rank };
}

const standingsKey = (period: "month" | "all", month?: string) => `contest:standings:${period}:${month ?? ""}`;

export interface StandingRow {
  rank: number;
  user: { id: string; name: string | null; username: string | null; avatar_url: string | null; xp: number };
  points: number;
  solved: number;
  penaltySec: number;
}

/**
 * Season standings: points over a month (or all time), ties broken by total
 * penalty, the way a contest series is. One GROUP BY over the date index; the
 * user rows for the top of the table are fetched in one IN.
 */
export async function standings(period: "month" | "all", month = todayUtc().slice(0, 7), limit = 50) {
  return cached(standingsKey(period, month), 30_000, async () => {
    const where = period === "month" ? { date: { startsWith: month }, solvedAt: { not: null } } : { solvedAt: { not: null } };
    const grouped = await prisma.dailyContestEntry.groupBy({
      by: ["userId"],
      where,
      _sum: { points: true, penaltySec: true },
      _count: { _all: true },
    });
    grouped.sort((a, b) => (b._sum.points ?? 0) - (a._sum.points ?? 0) || (a._sum.penaltySec ?? 0) - (b._sum.penaltySec ?? 0));
    const top = grouped.slice(0, limit);
    const users = await prisma.user.findMany({ where: { id: { in: top.map((g) => g.userId) } }, select: RANKED_USER_SELECT });
    const byId = new Map(users.map((u) => [u.id, u]));
    const rows: StandingRow[] = [];
    for (const g of top) {
      const user = byId.get(g.userId);
      if (!user) continue;
      rows.push({ rank: rows.length + 1, user, points: g._sum.points ?? 0, solved: g._count._all, penaltySec: g._sum.penaltySec ?? 0 });
    }
    return { rows, total: grouped.length };
  });
}

/** The reader's standing in a season, computed from the same ordering as the table. */
export async function myStanding(userId: string, period: "month" | "all", month = todayUtc().slice(0, 7)) {
  const where = period === "month" ? { date: { startsWith: month }, solvedAt: { not: null } } : { solvedAt: { not: null } };
  const mine = await prisma.dailyContestEntry.aggregate({ where: { ...where, userId }, _sum: { points: true, penaltySec: true }, _count: { _all: true } });
  const points = mine._sum.points ?? 0;
  if (mine._count._all === 0) return null;
  const penaltySec = mine._sum.penaltySec ?? 0;
  // Everyone with more points, or the same points and less penalty, is ahead.
  const grouped = await prisma.dailyContestEntry.groupBy({ by: ["userId"], where, _sum: { points: true, penaltySec: true } });
  let ahead = 0;
  for (const g of grouped) {
    if (g.userId === userId) continue;
    const p = g._sum.points ?? 0;
    if (p > points || (p === points && (g._sum.penaltySec ?? 0) < penaltySec)) ahead += 1;
  }
  return { rank: ahead + 1, points, solved: mine._count._all, penaltySec };
}

/* ── the calendar ──────────────────────────────────────────────────── */

export type CalendarStatus = "solved" | "attempted" | "missed" | "open" | "upcoming" | "none";

export interface CalendarDay {
  date: string;
  difficulty: string;
  status: CalendarStatus;
  problem: { slug: string; title: string } | null;
  solvers: number;
}

/**
 * One month for the calendar. Past days that were never materialised (nobody
 * visited) are created here so the record has no holes; a future day shows
 * only its weekday difficulty.
 */
export async function calendarMonth(month: string, userId: string | null, today = todayUtc()) {
  const start = `${month}-01`;
  const daysInMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  const end = `${month}-${String(daysInMonth).padStart(2, "0")}`;

  const [contests, first] = await Promise.all([
    prisma.dailyContest.findMany({
      where: { date: { gte: start, lte: end } },
      select: { id: true, date: true, difficulty: true, problem: { select: { slug: true, title: true } }, _count: { select: { entries: { where: { solvedAt: { not: null } } } } } },
    }),
    prisma.dailyContest.findFirst({ orderBy: { date: "asc" }, select: { date: true } }),
  ]);
  const byDate = new Map(contests.map((c) => [c.date, c]));

  // Fill any gap between the first contest ever held and today, in order, so
  // the "not reused for a year" rule sees the days before it.
  const launch = first?.date ?? today;
  for (let d = start; d <= end && d <= today; d = addDays(d, 1)) {
    if (d < launch || byDate.has(d)) continue;
    const made = await ensureContest(d);
    if (made) byDate.set(d, { id: made.id, date: made.date, difficulty: made.difficulty, problem: { slug: made.problem.slug, title: made.problem.title }, _count: { entries: 0 } });
  }

  const mine = userId
    ? await prisma.dailyContestEntry.findMany({ where: { userId, date: { gte: start, lte: end } }, select: { date: true, solvedAt: true } })
    : [];
  const mineByDate = new Map(mine.map((e) => [e.date, e]));

  const days: CalendarDay[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const contest = byDate.get(d);
    const entry = mineByDate.get(d);
    let status: CalendarStatus;
    if (d > today) status = "upcoming";
    else if (!contest) status = "none";
    else if (entry?.solvedAt) status = "solved";
    else if (d === today) status = "open";
    else if (entry) status = "attempted";
    else status = "missed";
    days.push({
      date: d,
      difficulty: contest?.difficulty ?? weekdayDifficulty(d),
      status,
      problem: contest ? contest.problem : null,
      solvers: contest?._count.entries ?? 0,
    });
  }
  const held = days.filter((x) => x.status !== "upcoming" && x.status !== "none").length;
  const solved = days.filter((x) => x.status === "solved").length;
  return { month, days, summary: { held, solved } };
}

/* ── the dashboard's slice ─────────────────────────────────────────── */

/** What the home dashboard shows: today's problem, whether it is done, and the streak. */
export async function contestSnapshot(userId: string) {
  const today = todayUtc();
  const [contest, streak] = await Promise.all([ensureContest(today), contestStreak(userId, today)]);
  return {
    date: today,
    endsAt: endOfDay(today),
    problem: contest ? { slug: contest.problem.slug, title: contest.problem.title, difficulty: contest.problem.difficulty } : null,
    streak,
  };
}
