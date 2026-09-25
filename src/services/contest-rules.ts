/**
 * ICPC-style scoring for Battles contests — pure, so contest-rules.test.ts
 * pins it without a database. services/contest.ts loads the rows and calls
 * these; nothing about the standings is stored, so they cannot drift from
 * the submissions they are computed from.
 *
 * The rules are the ICPC's:
 *  - teams rank by problems solved, then by total penalty time, then by who
 *    reached their last solve first; teams equal on all three share a rank.
 *  - a solved problem's penalty is the minutes from the start to its first
 *    accepted submission, plus WRONG_PENALTY_MINUTES for every rejected
 *    submission before it. An unsolved problem costs nothing.
 *  - a compile error, or the judge failing, is not a wrong answer: it costs
 *    no penalty and does not count as an attempt.
 *  - once solved, a problem's later submissions are ignored.
 *  - in the last `freezeMinutes` the public board stops updating: attempts
 *    made then are shown as pending, not as results, until the organizer
 *    reveals the final standings.
 */

export const WRONG_PENALTY_MINUTES = 20;

/** Verdicts that count as an attempt (and, before a solve, as a penalty). */
const COUNTED_REJECTIONS = new Set(["wrong_answer", "time_limit", "runtime_error", "memory_limit"]);

export type ContestVerdict = "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "memory_limit" | "compile_error" | "judge_error";

export interface ContestSubmissionRow {
  teamId: string;
  problemId: string;
  verdict: ContestVerdict;
  at: Date;
}

export interface ContestWindow {
  startsAt: Date;
  durationMinutes: number;
  freezeMinutes: number;
}

export type ContestState = "before" | "running" | "frozen" | "ended";

export const endsAt = (w: ContestWindow) => new Date(w.startsAt.getTime() + w.durationMinutes * 60_000);

/** When the public board stops updating, or null when this contest does not freeze. */
export function freezeAt(w: ContestWindow): Date | null {
  if (w.freezeMinutes <= 0 || w.freezeMinutes >= w.durationMinutes) return null;
  return new Date(endsAt(w).getTime() - w.freezeMinutes * 60_000);
}

export function contestState(w: ContestWindow, now: Date): ContestState {
  if (now < w.startsAt) return "before";
  if (now >= endsAt(w)) return "ended";
  const f = freezeAt(w);
  return f && now >= f ? "frozen" : "running";
}

/** Whole minutes from the start: a solve at 00:59:59 is minute 59. */
export const contestMinute = (w: ContestWindow, at: Date) => Math.floor((at.getTime() - w.startsAt.getTime()) / 60_000);

export interface Cell {
  /** Counted attempts, including the accepted one when solved. */
  attempts: number;
  /** Minute of the first accepted submission, or null. */
  solvedAt: number | null;
  /** Attempts made during the freeze that the board does not show yet. */
  pending: number;
  /** The first team to solve this problem. */
  firstSolve: boolean;
}

export interface StandingRow {
  teamId: string;
  name: string;
  rank: number;
  solved: number;
  penalty: number;
  cells: Record<string, Cell>;
}

/**
 * The standings. `revealed` lifts the freeze (the organizer has published the
 * final results); before that, submissions at or after the freeze are pending
 * for everyone — a team sees its own verdicts in its submission list, not on
 * the board, so every reader sees the same ranking.
 */
export function computeStandings(input: {
  window: ContestWindow;
  teams: { id: string; name: string }[];
  problemIds: string[];
  submissions: ContestSubmissionRow[];
  revealed: boolean;
}): StandingRow[] {
  const { window, teams, problemIds, submissions, revealed } = input;
  const start = window.startsAt.getTime();
  const end = endsAt(window).getTime();
  const frozenFrom = revealed ? null : freezeAt(window);
  const problems = new Set(problemIds);

  const blank = (): Cell => ({ attempts: 0, solvedAt: null, pending: 0, firstSolve: false });
  const cells = new Map<string, Record<string, Cell>>(teams.map((t) => [t.id, Object.fromEntries(problemIds.map((p) => [p, blank()]))]));

  const inOrder = submissions
    .filter((s) => s.at.getTime() >= start && s.at.getTime() < end && problems.has(s.problemId) && cells.has(s.teamId))
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  for (const s of inOrder) {
    const cell = cells.get(s.teamId)![s.problemId]!;
    if (cell.solvedAt !== null) continue;
    const counts = s.verdict === "accepted" || COUNTED_REJECTIONS.has(s.verdict);
    if (!counts) continue;
    if (frozenFrom && s.at >= frozenFrom) {
      cell.pending++;
      continue;
    }
    cell.attempts++;
    if (s.verdict === "accepted") cell.solvedAt = contestMinute(window, s.at);
  }

  // First to solve each problem, among what the board shows.
  for (const p of problemIds) {
    let best: Cell | null = null;
    for (const row of cells.values()) {
      const c = row[p]!;
      if (c.solvedAt !== null && (best === null || c.solvedAt < best.solvedAt!)) best = c;
    }
    if (best) best.firstSolve = true;
  }

  const rows = teams.map((t) => {
    const row = cells.get(t.id)!;
    let solved = 0;
    let penalty = 0;
    let lastSolve = -1;
    for (const c of Object.values(row)) {
      if (c.solvedAt === null) continue;
      solved++;
      penalty += c.solvedAt + (c.attempts - 1) * WRONG_PENALTY_MINUTES;
      lastSolve = Math.max(lastSolve, c.solvedAt);
    }
    return { teamId: t.id, name: t.name, solved, penalty, lastSolve, cells: row };
  });

  rows.sort((a, b) => b.solved - a.solved || a.penalty - b.penalty || a.lastSolve - b.lastSolve || a.name.localeCompare(b.name));

  let rank = 0;
  return rows.map((r, i) => {
    const prev = rows[i - 1];
    if (!prev || prev.solved !== r.solved || prev.penalty !== r.penalty || prev.lastSolve !== r.lastSolve) rank = i + 1;
    return { teamId: r.teamId, name: r.name, rank, solved: r.solved, penalty: r.penalty, cells: r.cells };
  });
}

/** "A", "B", … "O" — the problem's letter by its position in the set. */
export const problemLetter = (position: number) => String.fromCharCode(65 + position);
