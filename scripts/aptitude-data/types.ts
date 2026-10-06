import { APTITUDE_DIFFICULTIES, APTITUDE_TOPICS, aptitudeTopic, type AptitudeDifficulty } from "../../src/lib/aptitude-topics.js";

/**
 * One authored aptitude question. Markdown throughout; GFM tables are fine in
 * the prompt. `answer` indexes `options`. Hints go weakest first: the first
 * should only point at the idea, the last may all but give it away.
 */
export interface AptitudeSeed {
  slug: string;
  topic: string;
  title: string;
  prompt: string;
  options: string[];
  answer: number;
  difficulty: AptitudeDifficulty;
  hints: string[];
  solution: string;
  approach: string;
  /**
   * The faster route to this question's answer — the one-line method or
   * check a practised candidate uses. From extras/*.json (see extras.ts).
   */
  shortcut?: string;
  /**
   * The wrong option a hurried candidate picks, quoted as it appears in
   * `options`, and the slip that produces it. From extras/*.json.
   */
  trap?: string;
  tags?: string[];
  timeTargetSec?: number;
}

/** A shortcut or trap longer than this is a second solution, not a note. */
export const EXTRA_MAX_CHARS = 420;

/**
 * What is stored as the question's `approach` (AptitudeQuestion.approach —
 * "the idea or shortcut the question is really testing"): the authored idea,
 * then the shortcut and the common trap as labelled paragraphs. Folded into
 * the one column so the page ("The idea"), the prerendered HTML and the
 * assistant all carry them without a schema change (2026-10-01: the question
 * pages averaged ~131 words of their own, thin beside every other prep site).
 */
export function storedApproach(q: AptitudeSeed): string {
  return [q.approach.trim(), q.shortcut?.trim() ? `**Shortcut.** ${q.shortcut.trim()}` : "", q.trap?.trim() ? `**Common trap.** ${q.trap.trim()}` : ""].filter(Boolean).join("\n\n");
}

export interface SeedProblem {
  slug: string;
  problem: string;
}

/** Every reason a question would confuse the app or the candidate. */
export function validateAptitudeSeed(questions: AptitudeSeed[]): SeedProblem[] {
  const problems: SeedProblem[] = [];
  const seen = new Set<string>();
  for (const q of questions) {
    const bad = (problem: string) => problems.push({ slug: q.slug, problem });
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(q.slug)) bad("slug must be kebab-case");
    if (seen.has(q.slug)) bad("duplicate slug");
    seen.add(q.slug);
    if (!aptitudeTopic(q.topic)) bad(`unknown topic "${q.topic}"`);
    if (!q.title.trim()) bad("empty title");
    if (!q.prompt.trim()) bad("empty prompt");
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) bad("2 to 6 options expected");
    if (q.options.some((option) => !option.trim())) bad("empty option");
    if (new Set(q.options.map((option) => option.trim())).size !== q.options.length) bad("duplicate options");
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) bad("answer index out of range");
    if (!APTITUDE_DIFFICULTIES.includes(q.difficulty)) bad(`unknown difficulty "${q.difficulty}"`);
    if (!Array.isArray(q.hints) || q.hints.length < 1 || q.hints.length > 4) bad("1 to 4 hints expected");
    if (q.hints.some((hint) => !hint.trim())) bad("empty hint");
    if (!q.solution.trim()) bad("empty solution");
    if (!q.approach.trim()) bad("empty approach");
    for (const [field, value] of [["shortcut", q.shortcut], ["trap", q.trap]] as const) {
      if (value === undefined) continue;
      if (!value.trim()) bad(`empty ${field}`);
      if (value.length > EXTRA_MAX_CHARS) bad(`${field} over ${EXTRA_MAX_CHARS} characters`);
      if (value.includes("__CODEKAIRO_")) bad(`${field} contains a judge sentinel`);
    }
    if (q.timeTargetSec !== undefined && (!Number.isInteger(q.timeTargetSec) || q.timeTargetSec < 20 || q.timeTargetSec > 900)) bad("timeTargetSec out of range");
  }
  return problems;
}

/** Topics from the syllabus that no question covers yet. */
export function uncoveredTopics(questions: AptitudeSeed[]): string[] {
  const covered = new Set(questions.map((q) => q.topic));
  return APTITUDE_TOPICS.filter((topic) => !covered.has(topic.id)).map((topic) => topic.id);
}
