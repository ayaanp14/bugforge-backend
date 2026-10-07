import { CALENDAR_UTC_OFFSET_MINUTES } from "./clock.js";

/**
 * The skill scoring engine: one skill's mastery, confidence, review schedule
 * and weak spots, from the evidence that feeds it.
 *
 * Pure: everything comes in as plain records (services/skill-profile.ts reads
 * them from the existing tables) and `asOf` is the clock, so the same call
 * answers "where am I now" and "where was I a week ago" — which is how the
 * profile says *why* a score moved without storing a single snapshot.
 * skill-score.test.ts pins every rule below on hand-written histories.
 *
 * The model, in the order it is applied (SCORING_VERSION 1):
 *
 *  1. Each item (a problem, a hunt, a SQL problem, an aptitude question) is
 *     summarised: solved or not, how many tries the first accept took,
 *     whether the hints or the editorial were open before it, whether it was
 *     solved in a pair room, and how long it took when that was measured.
 *  2. A solve earns `quality` = independence × persistence (0–1): the
 *     editorial first is worth a quarter of a solve, hints six tenths, a
 *     pair-room solve seven tenths; five tries before the accept is worth
 *     0.65 of a first-try one. Re-solving the same problem earns nothing
 *     more — an item counts once, however often it is submitted.
 *  3. Depth: the solves' quality weighted by difficulty (easy 1, medium 2.5,
 *     hard 4 for problems), with Easy points capped, against a target sized
 *     to how much the catalogue holds for the skill. It saturates — the
 *     hundredth Easy adds nothing — which is what stops trivial activity
 *     from inflating anything.
 *  4. Performance: accuracy (solved of started, smoothed), independence,
 *     first-try rate and pace, weighted — "how well, when you do it".
 *  5. A ceiling from the hardest solve made without the editorial: Easy
 *     only caps the skill at 55, Medium at 85; a skill is only ever 100
 *     with a Hard behind it.
 *  6. Retention: a spaced-review ladder (2, 7, 21, 45, 90 days) walked from
 *     the days the skill was practised. A success on or after the due day
 *     moves up a rung; a day of failures on problems no harder than ones
 *     already solved moves down one and asks for a review tomorrow. Time
 *     away decays retention with a half-life of 1.5 rungs, and retention
 *     can take at most a quarter off the score — forgetting is real, but a
 *     month off does not erase forty solved problems.
 *
 *     mastery = min(ceiling, depth × (½ + ½·performance)) × (¾ + ¼·retention)
 *
 *  Assessments (skill-test sittings) are a second estimate — the best recent
 *  sitting's percentage, scaled by the level sat — blended with the practice
 *  estimate by how much evidence each rests on.
 *
 * Every constant is exported and named so the page can state the method and
 * a later version can tune it in one place; nothing here is learned from
 * data yet. The verdict-based mistake classes (mistakeOf) are estimates from
 * what the judge reports, not from reading the code — the page says so.
 */

export const SCORING_VERSION = 1;

export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];
const RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

export const toDifficulty = (value: string | null | undefined): Difficulty => {
  const v = (value ?? "").toLowerCase();
  return v === "hard" ? "hard" : v === "medium" ? "medium" : "easy";
};

export type EvidenceSource = "problem" | "bug" | "sql" | "aptitude";
export type Outcome = "accepted" | "wrong" | "runtime" | "timeout" | "compile" | "other";
export type Assist = "none" | "hints" | "solution";

/** The judges' verdicts in one vocabulary: coding (ACCEPTED, WRONG_ANSWER …), bug hunts (FAILED, ERROR), SQL (INVALID_QUERY). */
export function outcomeOf(verdict: string): Outcome {
  switch (verdict.toUpperCase()) {
    case "ACCEPTED":
      return "accepted";
    case "WRONG_ANSWER":
    case "FAILED":
      return "wrong";
    case "RUNTIME_ERROR":
    case "ERROR":
      return "runtime";
    case "TIME_LIMIT_EXCEEDED":
      return "timeout";
    case "COMPILATION_ERROR":
    case "INVALID_QUERY":
      return "compile";
    default:
      return "other";
  }
}

/**
 * A failed attempt's likely cause, from the verdict alone. A wrong answer
 * that passed at least this share of the hidden cases is filed as an edge
 * case; below it, as the approach itself being wrong. The judge runs every
 * case in one batch, so `passedCases` is the true count, not a prefix.
 */
export const NEAR_MISS_RATIO = 0.75;

export type MistakeClass = "SYNTAX" | "COMPLEXITY" | "IMPLEMENTATION" | "EDGE_CASE" | "CONCEPTUAL";
export const MISTAKE_CLASSES: readonly MistakeClass[] = ["EDGE_CASE", "CONCEPTUAL", "COMPLEXITY", "IMPLEMENTATION", "SYNTAX"];

export function mistakeOf(a: Pick<Attempt, "outcome" | "passRatio">): MistakeClass | null {
  switch (a.outcome) {
    case "compile":
      return "SYNTAX";
    case "timeout":
      return "COMPLEXITY";
    case "runtime":
      return "IMPLEMENTATION";
    case "wrong":
      return a.passRatio != null && a.passRatio >= NEAR_MISS_RATIO ? "EDGE_CASE" : "CONCEPTUAL";
    default:
      return null;
  }
}

export interface Attempt {
  /** Epoch ms. */
  at: number;
  outcome: Outcome;
  /** Share of the official cases passed, 0–1, when the source reports it. */
  passRatio?: number | null;
  /** Made in a pair room, where the room's code is credited to its host. */
  paired?: boolean;
  /** Seconds the source itself measured for this attempt (a hunt's timer, an aptitude question's clock). */
  secs?: number | null;
  /** The hints were open for this answer (the aptitude bank records it per answer). */
  hinted?: boolean;
  /** The answer was revealed rather than given (aptitude's "show solution"). */
  revealed?: boolean;
}

export interface ItemHistory {
  source: EvidenceSource;
  id: string;
  title: string;
  href: string;
  difficulty: Difficulty;
  /** The skill keys (lib/skill-graph) this item evidences. */
  skills: readonly string[];
  /** Every attempt, oldest first. */
  attempts: readonly Attempt[];
  /** First opened, when recorded (coding problems — ProblemEngagement). */
  openedAt?: number | null;
  /** First time the hints were shown. */
  hintsAt?: number | null;
  /** First time the editorial / reference solution was shown. */
  solutionAt?: number | null;
  /** This item's own par time in seconds (an aptitude question's target); otherwise the source's default. */
  parSecs?: number | null;
}

export interface AssessmentRecord {
  id: string;
  title: string;
  href: string;
  skills: readonly string[];
  /** When the sitting closed, epoch ms. */
  at: number;
  /** 0–100. */
  percent: number;
  level: "basic" | "intermediate" | "advanced";
  /** Closed by the proctor: kept as an attempt, never as evidence of knowledge. */
  terminated: boolean;
  topics: ReadonlyArray<{ label: string; total: number; correct: number }>;
}

/** How much the catalogue holds for one skill — the yardstick depth is measured against. */
export interface SkillCatalogue {
  source: EvidenceSource | "assessment";
  /** Items that evidence the skill. */
  count: number;
  /** Their difficulty weights, summed (SOURCE_RULES). */
  points: number;
}

// ── The rules ─────────────────────────────────────────────────────

export interface SourceRule {
  /** Depth credit of a full-quality solve, by difficulty. */
  weight: Record<Difficulty, number>;
  /** Easy credit counted at most — the ceiling on what easy work alone can show. */
  easyCap: number;
  /** The depth target is TARGET_SHARE of the catalogue's points for the skill, kept within these bounds. */
  target: { min: number; max: number };
  /** A fair time for a solve, by difficulty; null where the source cannot time one. */
  parSecs: Record<Difficulty, number> | null;
  /** Persistence: the credit kept when the accept came on try 1, 2, 3… (the last value holds beyond). */
  retry: readonly number[];
  /** What accuracy counts as a success: any accept, or only a first-try one (a multiple-choice retry is a guess). */
  accuracy: "solved" | "firstTry";
  /** The nouns the explanations use. */
  noun: [string, string];
  /** What the full answer is called where this kind of work keeps one. */
  answer: string;
}

export const SOURCE_RULES: Readonly<Record<EvidenceSource, SourceRule>> = {
  problem: {
    weight: { easy: 1, medium: 2.5, hard: 4 },
    easyCap: 4,
    target: { min: 3, max: 10 },
    parSecs: { easy: 15 * 60, medium: 30 * 60, hard: 50 * 60 },
    retry: [1, 0.9, 0.8, 0.75, 0.65],
    accuracy: "solved",
    noun: ["problem", "problems"],
    answer: "the editorial",
  },
  bug: {
    weight: { easy: 1, medium: 2, hard: 3 },
    easyCap: 3,
    target: { min: 3, max: 8 },
    parSecs: { easy: 10 * 60, medium: 20 * 60, hard: 35 * 60 },
    retry: [1, 0.9, 0.8, 0.75, 0.65],
    accuracy: "solved",
    noun: ["hunt", "hunts"],
    answer: "the fix",
  },
  sql: {
    weight: { easy: 1, medium: 2, hard: 3 },
    easyCap: 3,
    target: { min: 2.5, max: 7 },
    parSecs: null,
    retry: [1, 0.9, 0.8, 0.75, 0.65],
    accuracy: "solved",
    noun: ["SQL problem", "SQL problems"],
    answer: "the editorial",
  },
  aptitude: {
    weight: { easy: 0.25, medium: 0.4, hard: 0.6 },
    easyCap: 2,
    target: { min: 2, max: 5 },
    parSecs: { easy: 60, medium: 90, hard: 120 },
    retry: [1, 0.4],
    accuracy: "firstTry",
    noun: ["question", "questions"],
    answer: "the worked solution",
  },
};

export const TARGET_SHARE = 0.5;
export const ASSIST_FACTOR: Readonly<Record<Assist, number>> = { none: 1, hints: 0.6, solution: 0.25 };
export const PAIRED_FACTOR = 0.7;
/** The ceiling set by the hardest solve made without the editorial. */
export const CEILING = { none: 0, assistedOnly: 0.3, easy: 0.55, medium: 0.85, hard: 1 } as const;
export const PERFORMANCE_WEIGHTS = { accuracy: 0.35, independence: 0.3, firstTry: 0.15, pace: 0.2 } as const;
/** The spaced-review ladder, in days — the spec's +2, +7, +21, +45, and one more rung. */
export const REVIEW_LADDER_DAYS: readonly number[] = [2, 7, 21, 45, 90];
/** Retention's half-life is this many rungs of the current interval. */
export const RETENTION_HALF_LIFE = 1.5;
/** A coding solve is timed from the problem's first opening only when the accept came within this window: otherwise it was not one sitting. */
export const SOLVE_WINDOW_SECS = 3 * 60 * 60;
/**
 * A measured time past this many times par is not a measurement of solving:
 * the tab was left open. The aptitude clock tops out at an hour, and one
 * such answer read as "60× the target time on median" (2026-10-07).
 */
export const IDLE_PAR_RATIO = 8;
/** A skill-test sitting's percentage counts this much, by the level sat. */
export const LEVEL_CEILING: Readonly<Record<AssessmentRecord["level"], number>> = { basic: 0.7, intermediate: 0.9, advanced: 1 };
/** A sitting's weight halves towards ¾ over this many days. */
export const ASSESSMENT_HALF_LIFE_DAYS = 90;
/** Evidence count at which confidence reaches 1 − 1/e. */
export const CONFIDENCE_SCALE = 5;
/** Confidence drops by this factor when nothing in the skill has happened for STALE_DAYS. */
export const STALE_FACTOR = 0.7;
export const STALE_DAYS = 90;
/** Status bands. */
export const STATUS_BANDS = { practising: 35, strong: 70 } as const;

// ── Days ──────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;
const OFFSET_MS = CALENDAR_UTC_OFFSET_MINUTES * 60_000;
/** The platform calendar's day number (IST by default — the streak's calendar). */
export const dayOf = (ms: number): number => Math.floor((ms + OFFSET_MS) / DAY_MS);
/** The first instant of a calendar day, epoch ms. */
export const dayStartMs = (day: number): number => day * DAY_MS - OFFSET_MS;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const pct = (x: number | null): number | null => (x == null ? null : Math.round(clamp(x, 0, 1) * 100));
const plural = (n: number, [one, many]: [string, string]) => `${n} ${n === 1 ? one : many}`;

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// ── 1. One item ───────────────────────────────────────────────────

type Failure = Exclude<Outcome, "accepted">;

export interface ItemSummary {
  item: ItemHistory;
  attempts: number;
  solved: boolean;
  solvedAt: number | null;
  /** Tries up to and including the first accept. */
  attemptsToSolve: number | null;
  firstTry: boolean;
  assist: Assist;
  paired: boolean;
  /** How long the solve took, when the source measured it. */
  solveSecs: number | null;
  /** Failed attempts before the first accept (every attempt, when unsolved), by outcome. */
  failures: Record<Failure, number>;
  /** Of those, wrong answers that passed most of the cases. */
  nearMisses: number;
  firstAt: number;
  lastAt: number;
  /** Platform days with an accepted attempt, and days with attempts but none accepted. */
  successDays: number[];
  failDays: number[];
  /** The solve's credit, 0–1 (independence × persistence); 0 unsolved. */
  quality: number;
}

const independenceOf = (s: Pick<ItemSummary, "assist" | "paired">): number => ASSIST_FACTOR[s.assist] * (s.paired ? PAIRED_FACTOR : 1);

export function summarizeItem(item: ItemHistory, asOf: number): ItemSummary | null {
  const attempts = item.attempts.filter((a) => a.at <= asOf);
  if (!attempts.length) return null;
  const rule = SOURCE_RULES[item.source];

  const acceptIdx = attempts.findIndex((a) => a.outcome === "accepted");
  const solved = acceptIdx >= 0;
  const accept = solved ? attempts[acceptIdx] : null;
  const solvedAt = accept ? accept.at : null;
  const upToSolve = solved ? attempts.slice(0, acceptIdx + 1) : attempts;
  const before = solved ? attempts.slice(0, acceptIdx) : attempts;

  // Help counts only if it came before the solve: the editorial read
  // afterwards, to compare approaches, is studying, not leaning.
  const cutoff = solvedAt ?? asOf;
  let assist: Assist = "none";
  if (item.solutionAt != null && item.solutionAt <= cutoff) assist = "solution";
  else if (item.hintsAt != null && item.hintsAt <= cutoff) assist = "hints";
  for (const a of upToSolve) {
    if (a.revealed) assist = "solution";
    else if (a.hinted && assist === "none") assist = "hints";
  }

  const failures: Record<Failure, number> = { wrong: 0, runtime: 0, timeout: 0, compile: 0, other: 0 };
  let nearMisses = 0;
  for (const a of before) {
    if (a.outcome === "accepted") continue;
    failures[a.outcome]++;
    if (a.outcome === "wrong" && a.passRatio != null && a.passRatio >= NEAR_MISS_RATIO) nearMisses++;
  }

  let solveSecs: number | null = null;
  if (accept) {
    if (accept.secs != null && accept.secs > 0) solveSecs = accept.secs;
    else if (item.openedAt != null && item.openedAt <= accept.at && (accept.at - item.openedAt) / 1000 <= SOLVE_WINDOW_SECS) {
      solveSecs = Math.max(1, Math.round((accept.at - item.openedAt) / 1000));
    }
    const par = item.parSecs ?? rule.parSecs?.[item.difficulty] ?? null;
    if (solveSecs != null && par && solveSecs > IDLE_PAR_RATIO * par) solveSecs = null;
  }

  const success = new Set<number>();
  const touched = new Set<number>();
  for (const a of attempts) {
    const d = dayOf(a.at);
    touched.add(d);
    if (a.outcome === "accepted") success.add(d);
  }

  const attemptsToSolve = solved ? acceptIdx + 1 : null;
  const paired = Boolean(accept?.paired);
  const persistence = attemptsToSolve ? rule.retry[Math.min(attemptsToSolve - 1, rule.retry.length - 1)] : 0;
  return {
    item,
    attempts: attempts.length,
    solved,
    solvedAt,
    attemptsToSolve,
    firstTry: attemptsToSolve === 1,
    assist,
    paired,
    solveSecs,
    failures,
    nearMisses,
    firstAt: attempts[0].at,
    lastAt: attempts[attempts.length - 1].at,
    successDays: [...success].sort((a, b) => a - b),
    failDays: [...touched].filter((d) => !success.has(d)).sort((a, b) => a - b),
    quality: solved ? independenceOf({ assist, paired }) * persistence : 0,
  };
}

// ── 2. Reviews ────────────────────────────────────────────────────

export interface ReviewState {
  /** Rung on REVIEW_LADDER_DAYS. */
  stage: number;
  lastPracticedAt: number;
  nextReviewAt: number;
  due: boolean;
  overdueDays: number;
  /** 0–1. */
  retention: number;
}

/**
 * The skill's place on the review ladder, walked over the days it was
 * practised. Practising every day still climbs: a rung is climbed whenever
 * the gap since the last climb reaches the rung's interval, not only on the
 * exact due day — otherwise a learner working a topic daily would never be
 * credited with a review at all.
 */
export function reviewSchedule(summaries: readonly ItemSummary[], asOf: number): ReviewState | null {
  const events = new Map<number, { success: boolean; successRank: number; failRank: number }>();
  for (const s of summaries) {
    const rank = RANK[s.item.difficulty];
    for (const d of s.successDays) {
      const e = events.get(d) ?? { success: false, successRank: -1, failRank: 99 };
      e.success = true;
      e.successRank = Math.max(e.successRank, rank);
      events.set(d, e);
    }
    for (const d of s.failDays) {
      const e = events.get(d) ?? { success: false, successRank: -1, failRank: 99 };
      e.failRank = Math.min(e.failRank, rank);
      events.set(d, e);
    }
  }
  const days = [...events.keys()].sort((a, b) => a - b);
  let stage = -1;
  let due = 0;
  let lastSuccess = -1;
  let hardest = -1;
  for (const day of days) {
    const e = events.get(day)!;
    if (e.success) {
      if (stage < 0) {
        stage = 0;
        due = day + REVIEW_LADDER_DAYS[0];
      } else if (day >= due) {
        stage = Math.min(stage + 1, REVIEW_LADDER_DAYS.length - 1);
        due = day + REVIEW_LADDER_DAYS[stage];
      }
      lastSuccess = day;
      hardest = Math.max(hardest, e.successRank);
    } else if (stage >= 0 && e.failRank <= hardest) {
      // A day of failures on something no harder than what was already
      // solved is forgetting, not reaching: drop a rung, review tomorrow.
      // Failing above one's level is how a skill grows and costs nothing.
      stage = Math.max(0, stage - 1);
      due = day + 1;
    }
  }
  if (stage < 0) return null;
  const today = dayOf(asOf);
  const halfLife = RETENTION_HALF_LIFE * REVIEW_LADDER_DAYS[stage];
  return {
    stage,
    lastPracticedAt: Math.max(...summaries.filter((s) => s.solvedAt != null).map((s) => s.item.attempts.filter((a) => a.outcome === "accepted" && a.at <= asOf).at(-1)!.at)),
    nextReviewAt: dayStartMs(due),
    due: today >= due,
    overdueDays: Math.max(0, today - due),
    retention: Math.pow(2, -Math.max(0, today - lastSuccess) / halfLife),
  };
}

// ── 3. One skill ──────────────────────────────────────────────────

export type SkillStatus = "unstarted" | "learning" | "practising" | "strong";
export type ComponentKey = "depth" | "accuracy" | "independence" | "firstTry" | "pace" | "retention" | "assessment";

export interface ComponentLine {
  key: ComponentKey;
  label: string;
  /** 0–100, null when there is nothing to measure it from yet. */
  value: number | null;
  detail: string;
}

export type IndicatorCode =
  | "low_accuracy"
  | "assisted"
  | "many_attempts"
  | "timeouts"
  | "runtime_errors"
  | "near_misses"
  | "compile_errors"
  | "slow"
  | "easy_only"
  | "rusty"
  | "weak_topic"
  | "prerequisite_gap"
  | "repeat_mistake";

export interface Indicator {
  code: IndicatorCode;
  /** 1 (worth knowing) – 3 (the thing holding the skill back). */
  severity: 1 | 2 | 3;
  message: string;
  /** The mistake class it is evidence of, when it is one. */
  mistake?: MistakeClass;
}

export interface SkillCounts {
  attempted: number;
  solved: number;
  solvedBy: Record<Difficulty, number>;
  firstTry: number;
  hints: number;
  solution: number;
  paired: number;
  timed: number;
  /** Median of solve time ÷ par over the timed solves. */
  paceRatio: number | null;
  failures: Record<Failure, number>;
  nearMisses: number;
  /** Skill-test sittings that count (not closed by the proctor). */
  sittings: number;
}

export interface SkillScore {
  key: string;
  /** 0–100. */
  mastery: number;
  /** 0–1: how much evidence the estimate rests on. */
  confidence: number;
  status: SkillStatus;
  components: ComponentLine[];
  /** The cap the hardest independent solve allows, 0–100, and why. */
  ceiling: { value: number; detail: string } | null;
  counts: SkillCounts;
  review: ReviewState | null;
  lastActivityAt: number | null;
  indicators: Indicator[];
}

export const EMPTY_COUNTS = (): SkillCounts => ({
  attempted: 0,
  solved: 0,
  solvedBy: { easy: 0, medium: 0, hard: 0 },
  firstTry: 0,
  hints: 0,
  solution: 0,
  paired: 0,
  timed: 0,
  paceRatio: null,
  failures: { wrong: 0, runtime: 0, timeout: 0, compile: 0, other: 0 },
  nearMisses: 0,
  sittings: 0,
});

/** 1 at or under par, 0.3 at three times par or slower, linear between. */
export const paceScore = (ratio: number): number => (ratio <= 1 ? 1 : ratio >= 3 ? 0.3 : 1 - 0.35 * (ratio - 1));

export function confidenceOf(evidence: number, lastActivityAt: number | null, asOf: number): number {
  if (evidence <= 0) return 0;
  const base = 1 - Math.exp(-evidence / CONFIDENCE_SCALE);
  const stale = lastActivityAt != null && (asOf - lastActivityAt) / DAY_MS > STALE_DAYS;
  return stale ? base * STALE_FACTOR : base;
}

export function statusOf(mastery: number, started: boolean): SkillStatus {
  if (!started) return "unstarted";
  if (mastery >= STATUS_BANDS.strong) return "strong";
  if (mastery >= STATUS_BANDS.practising) return "practising";
  return "learning";
}

interface PracticeEstimate {
  mastery: number;
  confidence: number;
  components: ComponentLine[];
  ceiling: { value: number; detail: string } | null;
  counts: SkillCounts;
  review: ReviewState | null;
  indicators: Indicator[];
}

function practiceEstimate(source: EvidenceSource, summaries: readonly ItemSummary[], catalogue: SkillCatalogue | undefined, asOf: number): PracticeEstimate {
  const rule = SOURCE_RULES[source];
  const noun = rule.noun;
  const counts = EMPTY_COUNTS();
  const solved = summaries.filter((s) => s.solved);
  counts.attempted = summaries.length;
  counts.solved = solved.length;

  let easyPoints = 0;
  let otherPoints = 0;
  const ratios: number[] = [];
  let independenceSum = 0;
  let attemptsSum = 0;
  let hardestIndependent = -1;
  for (const s of solved) {
    const d = s.item.difficulty;
    counts.solvedBy[d]++;
    if (s.firstTry) counts.firstTry++;
    if (s.assist === "hints") counts.hints++;
    if (s.assist === "solution") counts.solution++;
    if (s.paired) counts.paired++;
    const credit = rule.weight[d] * s.quality;
    if (d === "easy") easyPoints += credit;
    else otherPoints += credit;
    independenceSum += independenceOf(s);
    attemptsSum += s.attemptsToSolve ?? 1;
    if (s.assist !== "solution") hardestIndependent = Math.max(hardestIndependent, RANK[d]);
    const par = s.item.parSecs ?? rule.parSecs?.[d] ?? null;
    if (s.solveSecs != null && par) ratios.push(s.solveSecs / par);
  }
  for (const s of summaries) {
    for (const k of Object.keys(s.failures) as Failure[]) counts.failures[k] += s.failures[k];
    counts.nearMisses += s.nearMisses;
  }
  counts.timed = ratios.length;
  counts.paceRatio = median(ratios);

  // Depth.
  const points = Math.min(easyPoints, rule.easyCap) + otherPoints;
  const target = clamp(TARGET_SHARE * (catalogue?.points ?? 0), rule.target.min, rule.target.max);
  const depth = 1 - Math.exp(-points / target);

  // Performance.
  const successes = rule.accuracy === "firstTry" ? counts.firstTry : counts.solved;
  const accuracy = counts.attempted ? (successes + 1) / (counts.attempted + 2) : null;
  const independence = solved.length ? independenceSum / solved.length : null;
  const firstTry = solved.length ? counts.firstTry / solved.length : null;
  const pace = counts.paceRatio != null ? paceScore(counts.paceRatio) : null;
  const parts: Array<[number | null, number]> = [
    [accuracy, PERFORMANCE_WEIGHTS.accuracy],
    [independence, PERFORMANCE_WEIGHTS.independence],
    [firstTry, PERFORMANCE_WEIGHTS.firstTry],
    [pace, PERFORMANCE_WEIGHTS.pace],
  ];
  const present = parts.filter(([v]) => v != null) as Array<[number, number]>;
  const performance = present.length ? present.reduce((a, [v, w]) => a + v * w, 0) / present.reduce((a, [, w]) => a + w, 0) : 0;

  // Ceiling.
  const ceilingValue = hardestIndependent === 2 ? CEILING.hard : hardestIndependent === 1 ? CEILING.medium : hardestIndependent === 0 ? CEILING.easy : solved.length ? CEILING.assistedOnly : CEILING.none;
  const ceilingDetail =
    hardestIndependent === 2
      ? `A Hard solved without ${rule.answer}: no cap.`
      : hardestIndependent === 1
        ? `Capped at ${Math.round(CEILING.medium * 100)} until you solve a Hard without ${rule.answer}.`
        : hardestIndependent === 0
          ? `Capped at ${Math.round(CEILING.easy * 100)} until you solve a Medium without ${rule.answer}.`
          : solved.length
            ? `Capped at ${Math.round(CEILING.assistedOnly * 100)}: every solve here came after ${rule.answer}.`
            : "Nothing solved yet.";

  // Retention.
  const review = reviewSchedule(summaries, asOf);
  const retention = review?.retention ?? null;

  const raw = Math.min(ceilingValue, depth * (0.5 + 0.5 * performance)) * (retention == null ? 1 : 0.75 + 0.25 * retention);
  const lastActivityAt = summaries.length ? Math.max(...summaries.map((s) => s.lastAt)) : null;

  const daysAgo = review ? Math.max(0, dayOf(asOf) - dayOf(review.lastPracticedAt)) : 0;
  const by = counts.solvedBy;
  const components: ComponentLine[] = [
    {
      key: "depth",
      label: "Depth",
      value: pct(depth),
      detail: counts.solved
        ? `${by.easy} easy, ${by.medium} medium and ${by.hard} hard solved${counts.hints + counts.solution + counts.paired ? ", part-credited where help was used" : ""}.`
        : `No ${noun[0]} solved yet.`,
    },
    {
      key: "accuracy",
      label: "Accuracy",
      value: pct(accuracy),
      // The value is smoothed ((successes + 1) / (attempts + 2)), so 2 of 2
      // reads 75%, not 100%: say why, while the sample is small enough to show it.
      detail: counts.attempted
        ? `${
            rule.accuracy === "firstTry"
              ? `${counts.firstTry} of ${plural(counts.attempted, noun)} right on the first answer.`
              : `Solved ${counts.solved} of the ${plural(counts.attempted, noun)} you started.`
          }${counts.attempted < 8 ? " With so few, it is counted cautiously." : ""}`
        : "Nothing attempted yet.",
    },
    {
      key: "independence",
      label: "Independence",
      value: pct(independence),
      detail: solved.length
        ? `${solved.length - counts.hints - counts.solution} of ${solved.length} solved before opening the hints or ${rule.answer}${counts.paired ? `; ${counts.paired} in a pair room` : ""}.`
        : "Measured on your solves.",
    },
    {
      key: "firstTry",
      label: "First try",
      value: pct(firstTry),
      detail: solved.length ? `${counts.firstTry} of ${solved.length} accepted on the first submission (${(attemptsSum / solved.length).toFixed(1)} tries on average).` : "Measured on your solves.",
    },
    {
      key: "pace",
      label: "Pace",
      value: pct(pace),
      detail:
        counts.paceRatio != null
          ? `Median solve took ${counts.paceRatio.toFixed(1)}× the target time, over ${plural(counts.timed, ["timed solve", "timed solves"])}.`
          : rule.parSecs
            ? `Timed from when you open a ${noun[0]} to its first accept, within ${SOLVE_WINDOW_SECS / 3600} hours.`
            : "Not timed for this kind of work.",
    },
    {
      key: "retention",
      label: "Retention",
      value: pct(retention),
      detail: review
        ? `Last solved ${daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`}; review step ${review.stage + 1} of ${REVIEW_LADDER_DAYS.length}.`
        : "Starts with your first solve.",
    },
  ];

  const indicators: Indicator[] = [];
  const itemsWith = (f: (s: ItemSummary) => boolean) => summaries.filter(f).length;
  if (counts.attempted >= 3 && counts.solved / counts.attempted < 0.5) {
    indicators.push({ code: "low_accuracy", severity: 3, message: `Solved ${counts.solved} of the ${plural(counts.attempted, noun)} you started here.` });
  }
  const timeouts = itemsWith((s) => s.failures.timeout > 0);
  if (timeouts >= 2) indicators.push({ code: "timeouts", severity: 3, mistake: "COMPLEXITY", message: `Time limit exceeded on ${plural(timeouts, noun)}: the approach was too slow for the constraints.` });
  const near = itemsWith((s) => s.nearMisses > 0);
  if (near >= 2) indicators.push({ code: "near_misses", severity: 3, mistake: "EDGE_CASE", message: `${plural(near, noun)} failed only a few hidden cases, which usually means an edge case was missed.` });
  const assisted = counts.hints + counts.solution;
  if (counts.solved >= 3 && assisted / counts.solved >= 0.5) {
    indicators.push({ code: "assisted", severity: 2, message: `${assisted} of your ${counts.solved} solves came after opening the hints or ${rule.answer}.` });
  }
  const crashes = itemsWith((s) => s.failures.runtime > 0);
  if (crashes >= 2) indicators.push({ code: "runtime_errors", severity: 2, mistake: "IMPLEMENTATION", message: `Runtime errors on ${plural(crashes, noun)}. Check the bounds, empty input and overflow.` });
  if (counts.solved >= 3 && attemptsSum / counts.solved >= 3) {
    indicators.push({ code: "many_attempts", severity: 2, message: `It takes ${(attemptsSum / counts.solved).toFixed(1)} submissions on average to get accepted. Test the examples and the edge cases before you submit.` });
  }
  if (counts.timed >= 2 && counts.paceRatio != null && counts.paceRatio >= 1.75) {
    indicators.push({ code: "slow", severity: 2, message: `Your timed solves took ${counts.paceRatio.toFixed(1)}× the target time on median.` });
  }
  if (counts.failures.compile >= 3) indicators.push({ code: "compile_errors", severity: 1, mistake: "SYNTAX", message: `${counts.failures.compile} submissions here did not compile.` });
  if (by.easy >= 3 && by.medium + by.hard === 0 && source !== "aptitude") {
    indicators.push({ code: "easy_only", severity: 1, message: `All ${by.easy} solves here are Easy. A Medium is what moves this skill past ${Math.round(CEILING.easy * 100)}.` });
  }
  if (review && review.retention < 0.4) indicators.push({ code: "rusty", severity: 1, message: `Last practised ${daysAgo} days ago. A review will bring it back.` });

  return {
    mastery: raw,
    confidence: confidenceOf(counts.attempted, lastActivityAt, asOf),
    components,
    ceiling: { value: Math.round(ceilingValue * 100), detail: ceilingDetail },
    counts,
    review,
    indicators,
  };
}

interface AssessmentEstimate {
  mastery: number;
  confidence: number;
  line: ComponentLine;
  sittings: number;
  lastAt: number | null;
  indicators: Indicator[];
}

function assessmentEstimate(records: readonly AssessmentRecord[], asOf: number): AssessmentEstimate | null {
  const sittings = records.filter((r) => r.at <= asOf);
  if (!sittings.length) return null;
  const valid = sittings.filter((r) => !r.terminated);
  let best = 0;
  let bestOf: AssessmentRecord | null = null;
  for (const r of valid) {
    const age = Math.max(0, (asOf - r.at) / DAY_MS);
    const v = (clamp(r.percent, 0, 100) / 100) * LEVEL_CEILING[r.level] * (0.75 + 0.25 * Math.pow(2, -age / ASSESSMENT_HALF_LIFE_DAYS));
    if (v > best) {
      best = v;
      bestOf = r;
    }
  }
  const confidence = valid.length ? Math.min(0.85, 1 - Math.pow(0.5, valid.length)) : 0;

  // Weak topics, over every counted sitting: the same topic missed across
  // two papers is a pattern, one wrong answer is not.
  const topics = new Map<string, { total: number; correct: number }>();
  for (const r of valid) {
    for (const t of r.topics) {
      const acc = topics.get(t.label) ?? { total: 0, correct: 0 };
      acc.total += t.total;
      acc.correct += t.correct;
      topics.set(t.label, acc);
    }
  }
  const weak = [...topics.entries()]
    .filter(([, t]) => t.total >= 2 && t.correct / t.total < 0.5)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .slice(0, 3);
  const indicators: Indicator[] = weak.map(([label, t]) => ({
    code: "weak_topic",
    severity: 2,
    message: `${label}: ${t.correct} of ${t.total} right across your sittings.`,
  }));

  const terminated = sittings.length - valid.length;
  return {
    mastery: best,
    confidence,
    sittings: valid.length,
    lastAt: Math.max(...sittings.map((s) => s.at)),
    indicators,
    line: {
      key: "assessment",
      label: "Skill test",
      value: pct(best),
      detail: bestOf
        ? `Best sitting ${bestOf.percent}% at ${bestOf.level} level; a sitting counts for less as it ages.${terminated ? ` ${terminated} closed by the proctor not counted.` : ""}`
        : `${terminated} sitting${terminated === 1 ? "" : "s"} closed by the proctor, so not counted.`,
    },
  };
}

/** Score one skill from the summaries of its items and its assessment sittings. */
export function scoreSkill(
  key: string,
  source: EvidenceSource | null,
  summaries: readonly ItemSummary[],
  assessments: readonly AssessmentRecord[],
  catalogue: SkillCatalogue | undefined,
  asOf: number,
): SkillScore {
  const practice = source && summaries.length ? practiceEstimate(source, summaries, catalogue, asOf) : null;
  const assessment = assessmentEstimate(assessments, asOf);

  let mastery = 0;
  let confidence = 0;
  if (practice && assessment && practice.confidence + assessment.confidence > 0) {
    mastery = (practice.mastery * practice.confidence + assessment.mastery * assessment.confidence) / (practice.confidence + assessment.confidence);
    confidence = 1 - (1 - practice.confidence) * (1 - assessment.confidence);
  } else if (practice) {
    mastery = practice.mastery;
    confidence = practice.confidence;
  } else if (assessment) {
    mastery = assessment.mastery;
    confidence = assessment.confidence;
  }

  const counts = practice?.counts ?? EMPTY_COUNTS();
  counts.sittings = assessment?.sittings ?? 0;
  const lastActivityAt = Math.max(practice ? Math.max(...summaries.map((s) => s.lastAt)) : -Infinity, assessment?.lastAt ?? -Infinity);
  const started = Boolean(practice) || Boolean(assessment);
  const rounded = Math.round(clamp(mastery, 0, 1) * 100);

  const components = [...(practice?.components ?? []), ...(assessment ? [assessment.line] : [])];
  const indicators = [...(practice?.indicators ?? []), ...(assessment?.indicators ?? [])].sort((a, b) => b.severity - a.severity);
  return {
    key,
    mastery: rounded,
    confidence: Math.round(confidence * 100) / 100,
    status: statusOf(rounded, started),
    components,
    ceiling: practice?.ceiling ?? null,
    counts,
    review: practice?.review ?? null,
    lastActivityAt: Number.isFinite(lastActivityAt) ? lastActivityAt : null,
    indicators,
  };
}

export type ConfidenceLabel = "none" | "low" | "medium" | "high";
export const confidenceLabel = (c: number): ConfidenceLabel => (c <= 0 ? "none" : c < 0.35 ? "low" : c < 0.7 ? "medium" : "high");
