/**
 * Full-length placement tests.
 *
 * A MockTest row is a company's *pattern*, not a paper: each section carries a
 * blueprint saying what to draw from the aptitude bank. A sitting draws its own
 * paper at the moment it starts, so two candidates — or the same candidate
 * twice — never see the same set.
 *
 * Everything about time is decided here and stored on the attempt. The client
 * renders a countdown, but the server owns the deadline, so closing the tab,
 * reloading, or editing the clock buys nothing.
 */
import type { AptitudeDifficulty } from "./aptitude-topics.js";

/** One draw rule inside a section's blueprint. */
export interface DrawRule {
  /** Draw from any of these topics. */
  topics?: string[];
  /** Or from a whole category, when the pattern is that loose. */
  category?: string;
  difficulty?: AptitudeDifficulty;
  count: number;
}

/** "mcq" draws from the aptitude bank; "coding" from the problem catalogue. */
export type SectionKind = "mcq" | "coding";

export interface SectionPlan {
  key: string;
  name: string;
  orderIndex: number;
  durationSec: number;
  questionCount: number;
  instructions?: string | null;
  kind?: SectionKind;
  marksPerQuestion?: number;
  blueprint: DrawRule[];
}

/** A section of a drawn paper, as stored on the attempt. */
export interface PaperSection {
  key: string;
  name: string;
  durationSec: number;
  kind: SectionKind;
  marksPerQuestion: number;
  /** Aptitude question ids for an mcq section, problem ids for a coding one. */
  questionIds: string[];
}

/**
 * The minimum a drawable item needs to expose.
 *
 * Problems and aptitude questions are drawn by the same code: a problem
 * presents its difficulty lowercased, the category "coding", and its tags,
 * so a blueprint can say `{ topics: ["Dynamic Programming"] }` for one and
 * `{ topics: ["percentages"] }` for the other with no special case.
 */
export interface DrawableQuestion {
  id: string;
  topic: string;
  category: string;
  difficulty: string;
  tags?: string[];
}

/** Fisher-Yates, so every ordering is equally likely. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const matchesRule = (question: DrawableQuestion, rule: DrawRule, ignoreDifficulty = false) => {
  if (rule.topics?.length) {
    const hit = rule.topics.includes(question.topic) || (question.tags ?? []).some((tag) => rule.topics!.includes(tag));
    if (!hit) return false;
  }
  if (rule.category && question.category !== rule.category) return false;
  if (!ignoreDifficulty && rule.difficulty && question.difficulty !== rule.difficulty) return false;
  return true;
};

/**
 * Draws one section. A rule that cannot be met at its stated difficulty
 * relaxes to any difficulty within the same topics rather than returning a
 * short section: a candidate sitting a 30-question paper must get 30
 * questions, and a slightly easier one is a far smaller problem than a gap.
 */
export function drawSection(
  section: SectionPlan,
  pool: DrawableQuestion[],
  used: Set<string>,
  random: () => number = Math.random
): { questionIds: string[]; shortfall: number } {
  const picked: string[] = [];

  for (const rule of section.blueprint) {
    const take = (candidates: DrawableQuestion[], want: number) => {
      for (const question of shuffle(candidates, random)) {
        if (picked.length >= section.questionCount) break;
        if (want <= 0) break;
        if (used.has(question.id)) continue;
        used.add(question.id);
        picked.push(question.id);
        want -= 1;
      }
      return want;
    };

    let outstanding = take(
      pool.filter((q) => matchesRule(q, rule)),
      rule.count
    );
    // Same topics, any difficulty.
    if (outstanding > 0) outstanding = take(pool.filter((q) => matchesRule(q, rule, true)), outstanding);
    // Last resort: anything in the same category as the first rule that names one.
    if (outstanding > 0 && rule.category) {
      outstanding = take(pool.filter((q) => q.category === rule.category), outstanding);
    }
  }

  // A blueprint whose counts undershoot the section length tops up from
  // whatever the rules were already drawing on.
  if (picked.length < section.questionCount) {
    const topics = new Set(section.blueprint.flatMap((rule) => rule.topics ?? []));
    const categories = new Set(section.blueprint.map((rule) => rule.category).filter(Boolean) as string[]);
    const fallback = pool.filter((q) => topics.has(q.topic) || categories.has(q.category));
    for (const question of shuffle(fallback, random)) {
      if (picked.length >= section.questionCount) break;
      if (used.has(question.id)) continue;
      used.add(question.id);
      picked.push(question.id);
    }
  }

  return { questionIds: picked, shortfall: Math.max(0, section.questionCount - picked.length) };
}

/**
 * Draws every section of a paper, never repeating within a pool.
 *
 * The two pools are kept apart: a coding section draws from `problems`, an
 * mcq section from `questions`, and the "already used" sets are separate so a
 * problem tagged "Array" can never collide with an aptitude question id.
 */
export function drawPaper(
  sections: SectionPlan[],
  pool: DrawableQuestion[],
  random: () => number = Math.random,
  problems: DrawableQuestion[] = []
): { paper: PaperSection[]; shortfalls: Array<{ key: string; missing: number }> } {
  const usedQuestions = new Set<string>();
  const usedProblems = new Set<string>();
  const paper: PaperSection[] = [];
  const shortfalls: Array<{ key: string; missing: number }> = [];

  for (const section of [...sections].sort((a, b) => a.orderIndex - b.orderIndex)) {
    const coding = section.kind === "coding";
    const { questionIds, shortfall } = drawSection(
      section,
      coding ? problems : pool,
      coding ? usedProblems : usedQuestions,
      random
    );
    paper.push({
      key: section.key,
      name: section.name,
      durationSec: section.durationSec,
      kind: coding ? "coding" : "mcq",
      marksPerQuestion: section.marksPerQuestion ?? 1,
      questionIds,
    });
    if (shortfall > 0) shortfalls.push({ key: section.key, missing: shortfall });
  }

  return { paper, shortfalls };
}

/**
 * Where a sitting stands right now, from the stored deadlines alone.
 *
 * `sectionEndsAt` only binds on a sectionally timed test. On a freely timed one
 * the candidate may roam, and the paper deadline is the only limit.
 */
export function attemptClock(attempt: {
  status: string;
  expiresAt: Date;
  sectionEndsAt: Date | null;
  sectionalTiming: boolean;
  now?: Date;
}) {
  const now = attempt.now ?? new Date();
  const paperRemainingSec = Math.max(0, Math.floor((attempt.expiresAt.getTime() - now.getTime()) / 1000));
  const sectionRemainingSec =
    attempt.sectionalTiming && attempt.sectionEndsAt
      ? Math.max(0, Math.floor((attempt.sectionEndsAt.getTime() - now.getTime()) / 1000))
      : paperRemainingSec;
  return {
    paperRemainingSec,
    sectionRemainingSec,
    paperExpired: attempt.status === "in-progress" && paperRemainingSec <= 0,
    sectionExpired: attempt.status === "in-progress" && attempt.sectionalTiming && sectionRemainingSec <= 0,
  };
}

/**
 * Marks for one question, honouring the pattern's negative marking.
 *
 * The `negativeMark &&` guard is not redundant: without it a pattern with no
 * penalty returns -0 for every wrong answer, which compares unequal to 0 and
 * would print as "-0" on a scorecard.
 */
export const markFor = (correct: boolean, answered: boolean, negativeMark: number) =>
  correct ? 1 : answered && negativeMark ? -negativeMark : 0;

/**
 * Marks for one coding problem.
 *
 * Partial credit per test case, which is how every pattern here actually
 * grades code: TCS, Infosys and Amazon all award progress on a problem that
 * was never fully solved.
 */
export const codingMarks = (passed: number, total: number, marksPerQuestion: number) =>
  total > 0 ? Math.round((passed / total) * marksPerQuestion * 100) / 100 : 0;

export const formatDuration = (seconds: number) => {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
};
