import { REVIEW_LADDER_DAYS, dayOf, dayStartMs, toDifficulty, type Difficulty } from "./skill-score.js";

/**
 * The browser extension's rules, pure (services/external.ts does the I/O).
 * The extension sits on LeetCode's problem pages and brings what this site
 * already knows to them: the company tags, the figures and lessons of the
 * matching catalogue problem, the tutor, "Why it failed", a revision ladder
 * for what was solved there, and that work in the skill profile.
 *
 * Three rules hold everything here:
 *
 *  - **Nothing of the other site is kept.** A statement, examples and code
 *    reach the model for one answer and are gone; what is stored is the
 *    learner's own record — a solve's name, difficulty and tags, a tutor
 *    thread, a review — exactly as for work done here.
 *  - **Never in ranked play.** A contest, an online assessment or a timed
 *    interview is where the tutor and the reviewer stay out (the owner's rule
 *    for the workbench: help the other side does not get). The extension
 *    checks the page itself; `rankedPath` repeats the check on the URL the
 *    request names, so a client that forgot is still refused.
 *  - **Self-reported is labelled.** Our judge never saw a LeetCode solve, so
 *    the skill profile counts it at half (lib/skill-score REPORTED_FACTOR).
 */

export const EXTERNAL_SOURCES = ["leetcode"] as const;
export type ExternalSource = (typeof EXTERNAL_SOURCES)[number];
export const isExternalSource = (v: unknown): v is ExternalSource => typeof v === "string" && (EXTERNAL_SOURCES as readonly string[]).includes(v);

/** A site's slug as LeetCode writes them: lower-case words joined by hyphens. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isExternalSlug = (v: unknown): v is string => typeof v === "string" && v.length <= 160 && SLUG_RE.test(v);

/** The site's own page for a problem — the only external link the payloads carry. */
export const externalUrl = (source: ExternalSource, slug: string): string => (source === "leetcode" ? `https://leetcode.com/problems/${slug}/` : "");

/**
 * Pages where help is ranked play: a contest round (leetcode.com/contest/…),
 * an assessment or a mock interview timed by the site. Matched on the path,
 * any host — the extension also runs on leetcode.cn.
 */
const RANKED_PATH = /^\/(?:contest|assessment|interview)(?:\/|$)/i;
export function rankedPath(url: unknown): boolean {
  if (typeof url !== "string" || !url) return false;
  try {
    return RANKED_PATH.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

export const RANKED_MESSAGE = "The tutor and the code review are off during a contest or a timed assessment — it would be help nobody else in it gets.";

// ── Matching our catalogue ─────────────────────────────────────────

export interface CatalogueEntry {
  id: string;
  slug: string;
  title: string;
}

/** A title as a key: lower case, letters and digits, single spaces. "Two Sum II - Input Array Is Sorted" → "two sum ii input array is sorted". */
export const titleKey = (title: string): string =>
  title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * The catalogue problem that is the same problem: the same slug, else the
 * same title once punctuation is set aside. Nothing looser — a wrong match
 * would put another problem's company tags and figures on the page, and no
 * match costs only the panel's catalogue half.
 */
export function matchProblem<T extends CatalogueEntry>(catalogue: readonly T[], slug: string, title: string | null): T | null {
  const bySlug = catalogue.find((p) => p.slug === slug);
  if (bySlug) return bySlug;
  const key = title ? titleKey(title) : "";
  if (!key) return null;
  const same = catalogue.filter((p) => titleKey(p.title) === key);
  return same.length === 1 ? same[0]! : null;
}

// ── A solve, as the extension reports it ───────────────────────────

export interface ReportedSolve {
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  /** When it was accepted, epoch ms; never in the future. */
  at: number;
}

export const SOLVE_LIMITS = { title: 200, tags: 12, tag: 60, import: 3_000 } as const;
/** The earliest date a reported solve may carry (LeetCode opened in 2015). */
const EARLIEST = Date.UTC(2015, 0, 1);

/**
 * One reported solve, made safe, or a sentence saying what is wrong. `now`
 * caps the date: an accept stamped in the future would set reviews nobody
 * could reach.
 */
export function parseSolve(raw: unknown, now: number): ReportedSolve | string {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  if (!isExternalSlug(o["slug"])) return "A solve needs the problem's slug.";
  const title = typeof o["title"] === "string" ? o["title"].replace(/\s+/g, " ").trim().slice(0, SOLVE_LIMITS.title) : "";
  if (!title) return "A solve needs the problem's title.";
  const tags = Array.isArray(o["tags"])
    ? [...new Set(o["tags"].filter((t): t is string => typeof t === "string").map((t) => t.replace(/\s+/g, " ").trim().slice(0, SOLVE_LIMITS.tag)).filter(Boolean))].slice(0, SOLVE_LIMITS.tags)
    : [];
  const stamp = typeof o["at"] === "number" && Number.isFinite(o["at"]) ? o["at"] : now;
  return { slug: o["slug"], title, difficulty: toDifficulty(typeof o["difficulty"] === "string" ? o["difficulty"] : null), tags, at: Math.min(Math.max(stamp, EARLIEST), now) };
}

/**
 * LeetCode's topic names where ours differ; the rest are the same words
 * (Array, Hash Table, Dynamic Programming …), so the skill graph reads them
 * through skillsForProblemTags like a catalogue problem's tags.
 */
const TAG_ALIASES: Readonly<Record<string, string>> = {
  "Binary Tree": "Tree",
  "Binary Search Tree": "Tree",
  "Doubly-Linked List": "Linked List",
  "Strongly Connected Component": "Graph",
  "Eulerian Circuit": "Graph",
  "Radix Sort": "Sorting",
};
export const normaliseTags = (tags: readonly string[]): string[] => [...new Set(tags.map((t) => TAG_ALIASES[t] ?? t))];

// ── The revision ladder ────────────────────────────────────────────

/**
 * Revisions of one problem: the skill profile's ladder (2, 7, 21, 45, 90
 * days), per problem rather than per skill — LeetCode grinders forget
 * problems, and the ask was to bring each one back.
 */
export const REVISION_LADDER_DAYS = REVIEW_LADDER_DAYS;

export interface RevisionState {
  track: boolean;
  /** Rung on the ladder; -1 before the first. */
  stage: number;
  nextReviewAt: number | null;
  lastReviewedAt: number | null;
}

export type RevisionEvent = { kind: "accepted"; at: number } | { kind: "remembered"; at: number } | { kind: "forgot"; at: number } | { kind: "track"; at: number; solvedAt: number } | { kind: "untrack" };

/** The day a rung's review falls due, from the day of `from`. */
const dueAfter = (from: number, stage: number): number => dayStartMs(dayOf(from) + REVISION_LADDER_DAYS[Math.min(stage, REVISION_LADDER_DAYS.length - 1)]!);

/**
 * The ladder after one event:
 *  - tracking starts at the first rung, due two days after the last solve
 *    (already due, for an old one);
 *  - an accept or a "remembered" on or after the due day climbs a rung; one
 *    before it changes nothing (re-solving the next morning is not recall);
 *  - "forgot" drops to the first rung and brings it back tomorrow — the
 *    skill-score ladder's rule for a failure.
 * Untracked problems never move.
 */
export function revise(state: RevisionState, event: RevisionEvent): RevisionState {
  if (event.kind === "untrack") return { ...state, track: false, nextReviewAt: null };
  if (event.kind === "track") {
    if (state.track) return state;
    const stage = Math.max(0, state.stage);
    return { track: true, stage, nextReviewAt: dueAfter(Math.max(event.solvedAt, state.lastReviewedAt ?? 0), stage), lastReviewedAt: state.lastReviewedAt };
  }
  if (!state.track) return state;
  if (event.kind === "forgot") return { track: true, stage: 0, nextReviewAt: dayStartMs(dayOf(event.at) + 1), lastReviewedAt: event.at };
  if (state.stage < 0 || state.nextReviewAt == null) return { track: true, stage: 0, nextReviewAt: dueAfter(event.at, 0), lastReviewedAt: event.at };
  if (dayOf(event.at) < dayOf(state.nextReviewAt)) return state;
  const stage = Math.min(state.stage + 1, REVISION_LADDER_DAYS.length - 1);
  return { track: true, stage, nextReviewAt: dueAfter(event.at, stage), lastReviewedAt: event.at };
}

export const isDue = (s: Pick<RevisionState, "track" | "nextReviewAt">, now: number): boolean => s.track && s.nextReviewAt != null && dayOf(now) >= dayOf(s.nextReviewAt);

// ── Failure reports ────────────────────────────────────────────────

/** LeetCode's verdict words → the judge vocabulary lib/skill-score outcomeOf reads. */
export function verdictOf(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (v.includes("wrong answer")) return "WRONG_ANSWER";
  if (v.includes("time limit")) return "TIME_LIMIT_EXCEEDED";
  if (v.includes("memory limit")) return "RUNTIME_ERROR";
  if (v.includes("output limit")) return "WRONG_ANSWER";
  if (v.includes("runtime error")) return "RUNTIME_ERROR";
  if (v.includes("compile error")) return "COMPILATION_ERROR";
  return null;
}

export const PROBLEM_LIMITS = { title: 200, statement: 12_000, example: 600, examples: 3, code: 64 * 1024, error: 2_000, shown: 1_000 } as const;

export interface PageProblem {
  title: string;
  /** The statement as the extension read it (Markdown-ish text: `**Constraints:**` survives). */
  statement: string;
  examples: Array<{ input: string; output: string }>;
}

const text = (v: unknown, max: number): string => (typeof v === "string" ? v.slice(0, max) : "");

/** The problem as the page shows it, clipped; null when it has no title or statement. */
export function parsePageProblem(raw: unknown): PageProblem | null {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const title = text(o["title"], PROBLEM_LIMITS.title).trim();
  const statement = text(o["statement"], PROBLEM_LIMITS.statement).trim();
  if (!title || !statement) return null;
  const examples = (Array.isArray(o["examples"]) ? o["examples"] : [])
    .slice(0, PROBLEM_LIMITS.examples)
    .map((e) => {
      const r = e && typeof e === "object" ? (e as Record<string, unknown>) : {};
      return { input: text(r["input"], PROBLEM_LIMITS.example), output: text(r["output"], PROBLEM_LIMITS.example) };
    })
    .filter((e) => e.input || e.output);
  return { title, statement, examples };
}

/** A language id as a judge would name it, or "unknown". */
export const languageOf = (v: unknown): string => (typeof v === "string" && /^[a-z0-9+#]{1,20}$/i.test(v.trim()) ? v.trim().toLowerCase() : "unknown");
