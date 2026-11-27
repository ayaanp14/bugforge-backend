import { unzoned, zoned } from "./clock.js";

/**
 * CodeKairo Wrapped — an account's year as a story (2026-11-27, the owner's
 * ask: something Gen Z shares on Instagram). Pure: services/wrapped.ts
 * gathers the facts from rows that already exist and this turns them into
 * the slides' numbers. Nothing is stored, every figure is re-derivable, and
 * nothing here is a claim the rows cannot back: "top 4%" is a count of
 * other accounts' first solves this year, not an estimate.
 *
 * The year is the product calendar's (IST, lib/clock), so a solve at 00:30 on
 * 1 January counts for the new year for everyone.
 */

export const WRAPPED_VERSION = 1;
/** The first year with a Wrapped: the platform's rows before it are thin. */
export const FIRST_WRAPPED_YEAR = 2025;
/** A percentile among fewer solvers than this says nothing. */
const MIN_SOLVERS_FOR_RANK = 20;
/** Only a flattering rank is shown; "top 80%" is not a slide anyone shares. */
const MAX_SHOWN_PERCENT = 50;
/** A "situationship" is a problem that took real back-and-forth. */
const MIN_SITUATIONSHIP_FAILS = 3;

/** Tags too broad to be anyone's "main character topic" unless nothing else was solved. */
const GENERIC_TAGS = new Set(["Array", "String", "Math", "Simulation"]);

/** The short word an era is named by ("Night Owl DP Era"). */
const TOPIC_SHORT: Record<string, string> = {
  "Dynamic Programming": "DP",
  "Depth-First Search": "DFS",
  "Breadth-First Search": "BFS",
  "Hash Table": "Hashmap",
  "Binary Search": "Binary Search",
  "Two Pointers": "Two Pointer",
  "Sliding Window": "Sliding Window",
  "Linked List": "Linked List",
  "Binary Tree": "Tree",
  Tree: "Tree",
  Graph: "Graph",
  Greedy: "Greedy",
  Backtracking: "Backtracking",
  Recursion: "Recursion",
  "Heap (Priority Queue)": "Heap",
  Heap: "Heap",
  Stack: "Stack",
  Queue: "Queue",
  "Bit Manipulation": "Bit Hacking",
  Sorting: "Sorting",
  Trie: "Trie",
  "Union Find": "Union Find",
  "Prefix Sum": "Prefix Sum",
  Matrix: "Matrix",
  Database: "SQL",
};

const LANGUAGE_LABEL: Record<string, string> = {
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
  javascript: "JavaScript",
  typescript: "TypeScript",
  csharp: "C#",
  go: "Go",
  kotlin: "Kotlin",
  swift: "Swift",
  rust: "Rust",
  php: "PHP",
  ruby: "Ruby",
};

export type ClockPersona = "night-owl" | "early-bird" | "daytime" | "golden-hour";

const CLOCK_WORD: Record<ClockPersona, string> = {
  "night-owl": "Night Owl",
  "early-bird": "Early Bird",
  daytime: "Daylight",
  "golden-hour": "Golden Hour",
};

export interface WrappedProblem {
  title: string;
  slug: string;
  difficulty: string;
  tags: readonly string[];
}

export interface WrappedFacts {
  year: number;
  now: Date;
  /** Coding submissions in the year, oldest first (no code). */
  submissions: ReadonlyArray<{ problemId: string; verdict: string; language: string; at: Date }>;
  /** SQL and bug-hunt submissions in the year: they count as showing up. */
  otherActivity: ReadonlyArray<{ at: Date; accepted: boolean }>;
  /** First solves (ProblemSolve) dated in the year. */
  firstSolves: ReadonlyArray<{ problemId: string; at: Date }>;
  problems: ReadonlyMap<string, WrappedProblem>;
  companyTags: ReadonlySet<string>;
  sqlSolved: number;
  huntsFixed: number;
  duels: { played: number; won: number };
  interviewsSat: number;
  /** Every account's first-solve count for the year (the account's own included). */
  solverCounts: readonly number[];
}

export interface Wrapped {
  version: number;
  year: number;
  /** The year is over: the numbers are final, not "so far". */
  final: boolean;
  /** Nothing at all happened this year — the page offers a start instead of slides. */
  empty: boolean;
  totals: {
    submissions: number;
    accepted: number;
    solved: number;
    sqlSolved: number;
    huntsFixed: number;
    activeDays: number;
    duelsPlayed: number;
    duelsWon: number;
    interviewsSat: number;
  };
  difficulty: { easy: number; medium: number; hard: number };
  /** First solves per month, January first. */
  months: number[];
  /** Longest run of consecutive days with an accepted answer. */
  bestStreak: number;
  topTopic: { name: string; solved: number } | null;
  situationship: { title: string; slug: string; fails: number; solved: boolean } | null;
  toxicTrait: { verdict: string; count: number } | null;
  language: { id: string; label: string; share: number } | null;
  clock: { persona: ClockPersona; label: string; peakHour: number; share: number; hours: number[] } | null;
  busiestDay: { date: string; submissions: number } | null;
  oneShot: { count: number; rate: number } | null;
  hardest: { title: string; slug: string; difficulty: string; tries: number } | null;
  topPercent: number | null;
  era: string;
}

const DIFF_RANK: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
const dayOf = (at: Date): string => zoned(at).toISOString().slice(0, 10);
const hourOf = (at: Date): number => zoned(at).getUTCHours();
const monthOf = (at: Date): number => zoned(at).getUTCMonth();

function personaOf(hour: number): ClockPersona {
  if (hour >= 22 || hour < 4) return "night-owl";
  if (hour < 9) return "early-bird";
  if (hour < 18) return "daytime";
  return "golden-hour";
}

/** Longest run of consecutive calendar days in a set of YYYY-MM-DD keys. */
export function longestRun(days: Iterable<string>): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev = -Infinity;
  for (const d of sorted) {
    const t = Date.parse(`${d}T00:00:00Z`) / 86_400_000;
    run = t - prev === 1 ? run + 1 : 1;
    prev = t;
    if (run > best) best = run;
  }
  return best;
}

/**
 * "Top N%": the share of solvers with at least as many first solves, rounded
 * up so the best account is top 1%. Null when it would say nothing (too few
 * solvers, no solves) or nothing kind.
 */
export function topPercentOf(mine: number, counts: readonly number[]): number | null {
  if (mine <= 0 || counts.length < MIN_SOLVERS_FOR_RANK) return null;
  const ahead = counts.filter((c) => c > mine).length;
  const pct = Math.max(1, Math.ceil(((ahead + 1) / counts.length) * 100));
  return pct <= MAX_SHOWN_PERCENT ? pct : null;
}

export function wrappedOf(f: WrappedFacts): Wrapped {
  const yearEnd = yearBounds(f.year).lt.getTime();
  const accepted = f.submissions.filter((s) => s.verdict === "ACCEPTED");

  // Showing up: any submission anywhere; a streak day needs an accepted one.
  const activeDays = new Set<string>();
  const solveDays = new Set<string>();
  const hours = new Array<number>(24).fill(0);
  const perDay = new Map<string, number>();
  const touch = (at: Date, ok: boolean) => {
    const d = dayOf(at);
    activeDays.add(d);
    if (ok) solveDays.add(d);
    hours[hourOf(at)]! += 1;
    perDay.set(d, (perDay.get(d) ?? 0) + 1);
  };
  for (const s of f.submissions) touch(s.at, s.verdict === "ACCEPTED");
  for (const o of f.otherActivity) touch(o.at, o.accepted);

  const totalEvents = f.submissions.length + f.otherActivity.length;

  // First solves: difficulty, months, topic, hardest, one-shots.
  const difficulty = { easy: 0, medium: 0, hard: 0 };
  const months = new Array<number>(12).fill(0);
  const tagCount = new Map<string, number>();
  // Each problem's submission times, so "tries before the solve" is one pass, not a scan per solve.
  const timesOf = new Map<string, number[]>();
  for (const s of f.submissions) {
    const list = timesOf.get(s.problemId);
    if (list) list.push(s.at.getTime());
    else timesOf.set(s.problemId, [s.at.getTime()]);
  }
  const triesBefore = new Map<string, number>();
  for (const fs of f.firstSolves) {
    const p = f.problems.get(fs.problemId);
    months[monthOf(fs.at)]! += 1;
    if (!p) continue;
    if (p.difficulty === "Easy") difficulty.easy++;
    else if (p.difficulty === "Medium") difficulty.medium++;
    else if (p.difficulty === "Hard") difficulty.hard++;
    for (const t of p.tags) if (!f.companyTags.has(t)) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    const solvedAt = fs.at.getTime();
    triesBefore.set(fs.problemId, (timesOf.get(fs.problemId) ?? []).filter((t) => t <= solvedAt).length);
  }

  const rankedTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const topTag = rankedTags.find(([t]) => !GENERIC_TAGS.has(t)) ?? rankedTags[0] ?? null;
  const topTopic = topTag ? { name: topTag[0], solved: topTag[1] } : null;

  let hardest: Wrapped["hardest"] = null;
  for (const fs of f.firstSolves) {
    const p = f.problems.get(fs.problemId);
    if (!p) continue;
    const tries = triesBefore.get(fs.problemId) ?? 1;
    const better =
      !hardest ||
      (DIFF_RANK[p.difficulty] ?? 0) > (DIFF_RANK[hardest.difficulty] ?? 0) ||
      ((DIFF_RANK[p.difficulty] ?? 0) === (DIFF_RANK[hardest.difficulty] ?? 0) && tries > hardest.tries);
    if (better) hardest = { title: p.title, slug: p.slug, difficulty: p.difficulty, tries: Math.max(1, tries) };
  }

  const oneShots = f.firstSolves.filter((fs) => (triesBefore.get(fs.problemId) ?? 0) === 1).length;
  const oneShot = f.firstSolves.length >= 3 ? { count: oneShots, rate: Math.round((oneShots / f.firstSolves.length) * 100) } : null;

  // The problem that took the most back-and-forth.
  const fails = new Map<string, number>();
  const failVerdicts = new Map<string, number>();
  for (const s of f.submissions) {
    if (s.verdict === "ACCEPTED") continue;
    fails.set(s.problemId, (fails.get(s.problemId) ?? 0) + 1);
    failVerdicts.set(s.verdict, (failVerdicts.get(s.verdict) ?? 0) + 1);
  }
  const acceptedIds = new Set(accepted.map((s) => s.problemId));
  const worst = [...fails.entries()].filter(([id]) => f.problems.has(id)).sort((a, b) => b[1] - a[1])[0];
  const situationship =
    worst && worst[1] >= MIN_SITUATIONSHIP_FAILS
      ? { title: f.problems.get(worst[0])!.title, slug: f.problems.get(worst[0])!.slug, fails: worst[1], solved: acceptedIds.has(worst[0]) }
      : null;
  const trait = [...failVerdicts.entries()].sort((a, b) => b[1] - a[1])[0];
  const toxicTrait = trait ? { verdict: trait[0], count: trait[1] } : null;

  const langs = new Map<string, number>();
  for (const s of f.submissions) langs.set(s.language, (langs.get(s.language) ?? 0) + 1);
  const lang = [...langs.entries()].sort((a, b) => b[1] - a[1])[0];
  const language = lang ? { id: lang[0], label: LANGUAGE_LABEL[lang[0]] ?? lang[0], share: Math.round((lang[1] / f.submissions.length) * 100) } : null;

  let clock: Wrapped["clock"] = null;
  if (totalEvents > 0) {
    const buckets = new Map<ClockPersona, number>();
    hours.forEach((n, h) => buckets.set(personaOf(h), (buckets.get(personaOf(h)) ?? 0) + n));
    const [persona, n] = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0]!;
    const peakHour = hours.indexOf(Math.max(...hours));
    clock = { persona, label: CLOCK_WORD[persona], peakHour, share: Math.round((n / totalEvents) * 100), hours };
  }

  const busiest = [...perDay.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const busiestDay = busiest ? { date: busiest[0], submissions: busiest[1] } : null;

  const topicWord = topTopic ? (TOPIC_SHORT[topTopic.name] ?? topTopic.name) : null;
  const era = `${clock ? clock.label : "Fresh"} ${topicWord ?? "Grind"} Era`;

  return {
    version: WRAPPED_VERSION,
    year: f.year,
    final: f.now.getTime() >= yearEnd,
    empty: totalEvents === 0,
    totals: {
      submissions: totalEvents,
      accepted: accepted.length,
      solved: f.firstSolves.length,
      sqlSolved: f.sqlSolved,
      huntsFixed: f.huntsFixed,
      activeDays: activeDays.size,
      duelsPlayed: f.duels.played,
      duelsWon: f.duels.won,
      interviewsSat: f.interviewsSat,
    },
    difficulty,
    months,
    bestStreak: longestRun(solveDays),
    topTopic,
    situationship,
    toxicTrait,
    language,
    clock,
    busiestDay,
    oneShot,
    hardest,
    topPercent: topPercentOf(f.firstSolves.length, f.solverCounts),
    era,
  };
}

/** The year a request may ask for: the first Wrapped year up to the current IST year. */
export function wrappedYear(asked: unknown, now = new Date()): number | null {
  const current = zoned(now).getUTCFullYear();
  if (asked === undefined || asked === null || asked === "") return current;
  const y = Number(asked);
  return Number.isInteger(y) && y >= FIRST_WRAPPED_YEAR && y <= current ? y : null;
}

/** The year's bounds as real instants: 00:00 IST on 1 January to the next. */
export function yearBounds(year: number): { gte: Date; lt: Date } {
  return { gte: unzoned(new Date(Date.UTC(year, 0, 1))), lt: unzoned(new Date(Date.UTC(year + 1, 0, 1))) };
}
