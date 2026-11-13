/**
 * Virtual contests and the CP rating (2026-11-14, the owner's Competitive
 * Programming track: "a timed set of 4–5 problems with ICPC-style scoring,
 * reusing the Battles contest engine, plus a personal CP rating").
 *
 * A virtual contest is a solo ICPC round on catalogue problems: the member
 * picks a level, gets 4–5 problems they have not solved, and has one clock.
 * Attempts are their ordinary submissions on those problems inside the
 * window — nothing extra is recorded — scored by the Battles engine's own
 * rules (services/contest-rules computeStandings: problems solved, then the
 * minutes to each accept plus 20 per rejected try before it).
 *
 * The rating: each problem carries a difficulty rating; a contest's
 * performance is the rating at which the expected number of solves equals the
 * solves made (the Elo expectation, solved for R), nudged by speed; the CP
 * rating moves towards each performance, faster for the first few contests.
 * Everything here is pure; pinned by virtual-contest.test.ts.
 */

export type ContestLevel = "beginner" | "intermediate" | "advanced";

export interface LevelSpec {
  label: string;
  /** The problems, by difficulty, in board order (A first). */
  mix: Array<"Easy" | "Medium" | "Hard">;
  minutes: number;
}

export const LEVELS: Record<ContestLevel, LevelSpec> = {
  beginner: { label: "Beginner", mix: ["Easy", "Easy", "Medium", "Medium"], minutes: 90 },
  intermediate: { label: "Intermediate", mix: ["Easy", "Medium", "Medium", "Hard", "Hard"], minutes: 120 },
  advanced: { label: "Advanced", mix: ["Medium", "Medium", "Hard", "Hard", "Hard"], minutes: 150 },
};
export const isLevel = (v: unknown): v is ContestLevel => typeof v === "string" && v in LEVELS;

/** A problem's rating by its catalogue difficulty — the scale the performance is solved on. */
export const PROBLEM_RATING: Record<string, number> = { Easy: 1100, Medium: 1600, Hard: 2100 };

/**
 * The catalogue stores difficulty upper-case ("EASY"); the mix and the ratings
 * are written "Easy". Every comparison goes through this.
 */
const sameDifficulty = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** A problem's rating from its stored difficulty, whatever its case; Medium's when unknown. */
export function problemRating(difficulty: string): number {
  const key = Object.keys(PROBLEM_RATING).find((k) => sameDifficulty(k, difficulty));
  return key ? PROBLEM_RATING[key]! : PROBLEM_RATING["Medium"]!;
}
export const START_RATING = 1200;

export interface PickRow {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
}

/** A deterministic shuffle for a seed (the contest's id), so a reload never re-deals the set. */
function shuffle<T>(list: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * The set for a level: one problem per slot of the mix, never one the member
 * has solved (unless the catalogue has nothing else at that difficulty),
 * never the same problem twice. Null when the catalogue cannot fill it.
 */
export function pickProblems(catalogue: readonly PickRow[], solved: ReadonlySet<string>, level: ContestLevel, seed: string): PickRow[] | null {
  const taken = new Set<string>();
  const out: PickRow[] = [];
  for (const [slot, difficulty] of LEVELS[level].mix.entries()) {
    const pool = catalogue.filter((p) => sameDifficulty(p.difficulty, difficulty) && !taken.has(p.id));
    const fresh = pool.filter((p) => !solved.has(p.id));
    const choice = shuffle(fresh.length ? fresh : pool, `${seed}:${slot}`)[0];
    if (!choice) return null;
    taken.add(choice.id);
    out.push(choice);
  }
  return out;
}

/** Probability of solving a problem rated `d` at rating `r` — the Elo expectation. */
const expect = (r: number, d: number) => 1 / (1 + Math.pow(10, (d - r) / 400));

/**
 * The contest's performance rating: the R at which the expected solves equal
 * the solves made (bisection), with none or all solved taken as a quarter of a
 * problem from the edge so the answer stays finite; then up to +60 for speed —
 * how much of the clock the solved problems left unused, penalty included.
 */
export function performance(problemRatings: readonly number[], solved: number, penaltyMinutes: number, durationMinutes: number): number {
  const n = problemRatings.length;
  if (n === 0) return START_RATING;
  const target = Math.min(n - 0.25, Math.max(0.25, solved));
  let lo = 0;
  let hi = 4000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const e = problemRatings.reduce((s, d) => s + expect(mid, d), 0);
    if (e < target) lo = mid;
    else hi = mid;
  }
  const base = (lo + hi) / 2;
  const speed = solved > 0 ? Math.max(0, 1 - penaltyMinutes / (solved * durationMinutes)) : 0;
  return Math.round(base + 60 * speed);
}

/** The rating after a contest: a quarter of the way towards the performance, half for the first three contests. */
export function nextRating(current: number, perf: number, contestsBefore: number): number {
  const k = contestsBefore < 3 ? 0.5 : 0.25;
  return Math.round(current + k * (perf - current));
}

/** A rating's title, for the rating card. */
export function ratingTitle(r: number): string {
  if (r >= 2100) return "Master";
  if (r >= 1800) return "Expert";
  if (r >= 1500) return "Specialist";
  if (r >= 1200) return "Pupil";
  return "Newcomer";
}
