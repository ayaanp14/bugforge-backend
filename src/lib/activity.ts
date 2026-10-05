import { dayKey, dayStart, daysBetween } from "./clock.js";
import { sqlProblem } from "./sql-problems/index.js";

/**
 * What counts as activity, as pure rules: the solving streak, the heatmap's
 * days, the merged submission history and the SQL problems' share of the
 * solved counts. The queries live in services/dashboard.ts and services/me.ts
 * and the writes in lib/solve-payout.ts; everything that decides a number is
 * here, so activity.test.ts can pin it without a database.
 *
 * Two arenas count in full: coding problems (`Submission`) and SQL problems
 * (`SqlSubmission`, since 2026-10-05). A bug hunt's first fix keeps the
 * streak alive without adding a day and is not on the heatmap
 * (routes/bug-challenges.ts) — that partial credit is deliberate and is not
 * modelled here.
 */

// ── XP ──────────────────────────────────────────────────────────

/** XP for a first accepted solve, coding or SQL: 10/20/30 by difficulty, either spelling. */
export function solveXp(difficulty: string): number {
  const d = difficulty.toLowerCase();
  return d === "hard" ? 30 : d === "medium" ? 20 : 10;
}

// ── The solving streak ──────────────────────────────────────────

export interface SolveStreak {
  currentStreak: number;
  longestStreak: number;
}

/**
 * The streak after a first solve, from the stats row as it stood before it.
 *
 * Day boundaries come from the product calendar (lib/clock.ts, IST), not the
 * server's zone: on Railway that was UTC, so a solve at 1 am IST counted
 * toward the previous day and a candidate who solved every evening and once
 * after midnight watched their streak reset.
 *
 * Active yesterday extends the streak, a gap restarts it at 1, and already
 * active today keeps it — which is what stops a second solve on the same day,
 * coding or SQL, from counting the day twice. "Active today" is never less
 * than 1, though: a row can be stamped today by something that does not count
 * a day (a bug fix, which keeps the streak alive without adding to it) while
 * holding 0 — a new account whose first act was a fix, or a lapsed streak
 * reset by /api/me — and a solve on that day left it at 0.
 *
 * The result is written as absolute values, never an increment, which is what
 * makes concurrent solves safe without a lock: two solves that read the same
 * row compute the same streak, and one that reads the row after the other
 * wrote it sees today and keeps it.
 */
export function nextStreak(
  stats: { lastActive: Date; currentStreak: number; longestStreak: number } | null,
  now = new Date(),
): SolveStreak {
  if (!stats) return { currentStreak: 1, longestStreak: 1 };
  const diffDays = daysBetween(new Date(stats.lastActive), now);
  const currentStreak = diffDays === 0 ? Math.max(1, stats.currentStreak) : diffDays === 1 ? stats.currentStreak + 1 : 1;
  return { currentStreak, longestStreak: Math.max(currentStreak, stats.longestStreak) };
}

// ── The 365-day heatmap ─────────────────────────────────────────

const DAY_MS = 86_400_000;
export const HEATMAP_DAYS = 365;

/** The heatmap's window: 365 product-calendar days ending with today, as the real instants that bound them. */
export function heatmapWindow(now = new Date()): { from: Date; to: Date } {
  const todayStart = dayStart(now);
  return {
    from: new Date(todayStart.getTime() - (HEATMAP_DAYS - 1) * DAY_MS),
    to: new Date(todayStart.getTime() + DAY_MS - 1),
  };
}

/** One row of the heatmap statement: a day (YYYY-MM-DD, IST) and how many accepted submissions one table holds for it. */
export interface DayCountRow {
  d: string;
  /** COUNT(*) arrives from MySQL as a BigInt. */
  n: bigint | number;
}

/**
 * The window's days and the numbers derived from them.
 *
 * `rows` may name a day more than once — the statement unions one GROUP BY
 * per arena — and a day's count is the sum. A day is active when any arena
 * has an accepted submission on it, and the streaks are runs of active days,
 * so a day with both a coding and a SQL solve is one day, not two.
 * `currentStreak` is the run that reaches today; a day not yet solved reads 0.
 */
export function tallyHeatmap(rows: readonly DayCountRow[], from: Date) {
  const dailyCounts: Record<string, number> = {};
  let totalSubmissions = 0;
  for (const row of rows) {
    const n = Number(row.n);
    dailyCounts[row.d] = (dailyCounts[row.d] ?? 0) + n;
    totalSubmissions += n;
  }

  const dates: string[] = [];
  for (let i = 0; i < HEATMAP_DAYS; i++) dates.push(dayKey(new Date(from.getTime() + i * DAY_MS)));

  let maxStreak = 0;
  let currentStreak = 0;
  let activeDays = 0;
  for (const date of dates) {
    if (dailyCounts[date]) {
      activeDays++;
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  return { dates, dailyCounts, totalSubmissions, activeDays, maxStreak, currentStreak };
}

// ── Submission history ──────────────────────────────────────────

/** One row of the merged history: slim, never the code or the query that was sent. */
export interface HistoryRow {
  id: string;
  type: "problem" | "bug" | "sql";
  title: string;
  /** A coding problem's slug — every client reads it as /problems/<slug>. */
  problemSlug: string | undefined;
  /**
   * A SQL problem's slug; its page is /sql/<slug>. Kept out of `problemSlug`
   * on purpose: the mobile app opens any row carrying one in its coding
   * workbench, and a SQL slug there is a dead end.
   */
  sqlSlug?: string;
  difficulty: string;
  verdict: string;
  language: string;
  runtime: string;
  memory: string;
  submittedAt: Date;
}

/**
 * A SqlSubmission as a history row. The fields are named rather than read
 * off the row, so a `query` selected by mistake cannot travel — the history
 * reaches public profiles (services/public-profile.ts).
 */
export function sqlHistoryRow(s: { id: string; slug: string; verdict: string; runtimeMs: number; submittedAt: Date }): HistoryRow {
  const spec = sqlProblem(s.slug);
  return {
    id: s.id,
    type: "sql",
    // A problem taken out of the module keeps its rows; its slug stands in.
    title: spec?.title ?? s.slug,
    problemSlug: undefined,
    sqlSlug: s.slug,
    difficulty: spec?.difficulty ?? "",
    verdict: s.verdict,
    language: "MySQL",
    runtime: s.runtimeMs > 0 ? `${Math.round(s.runtimeMs)}ms` : "N/A",
    memory: "N/A",
    submittedAt: s.submittedAt,
  };
}

/**
 * Newest first across the arenas, then the page. Each list arrives sorted and
 * already cut to the window the page needs; the sort is stable, so rows at
 * the same instant keep the arenas' order.
 */
export function mergeHistory<T extends { submittedAt: Date | string }>(lists: ReadonlyArray<readonly T[]>, skip: number, limit: number): T[] {
  return lists
    .flat()
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(skip, skip + limit);
}

// ── SQL solves ──────────────────────────────────────────────────

/**
 * An account's SQL standing from its `SqlSolve` rows (one per problem, at the
 * first accept): how many it has solved, and the last seven days' share for
 * the trends. Only problems the module still ships count, as the coding
 * "solved" counts only published problems (services/dashboard.ts countSolved).
 */
export function sqlSolveTally(solves: ReadonlyArray<{ slug: string; submittedAt: Date }>, now = new Date()) {
  // Rolling windows, as the coding trends' are (services/me.ts getUserTrends).
  const weekAgo = now.getTime() - 7 * DAY_MS;
  const dayAgo = now.getTime() - DAY_MS;
  let solved = 0;
  let solvedThisWeek = 0;
  let solvedToday = 0;
  let xpThisWeek = 0;
  for (const s of solves) {
    const spec = sqlProblem(s.slug);
    if (!spec) continue;
    solved++;
    const at = new Date(s.submittedAt).getTime();
    if (at >= weekAgo) {
      solvedThisWeek++;
      xpThisWeek += solveXp(spec.difficulty);
    }
    if (at >= dayAgo) solvedToday++;
  }
  return { solved, solvedThisWeek, solvedToday, xpThisWeek };
}
