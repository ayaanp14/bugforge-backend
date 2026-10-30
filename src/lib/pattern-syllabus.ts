import { APTITUDE_TOPICS, aptitudeTopic } from "./aptitude-topics.js";
import type { DrawRule } from "./mock-tests.js";

/**
 * The aptitude topics a placement pattern's multiple-choice section draws
 * from, read off its seeded blueprint (scripts/mock-test-data) — the one
 * sourced statement of what a pattern asks. A rule naming topics gives those;
 * a rule naming a whole category gives every topic of it.
 *
 * What it is for: a search for "<company> aptitude syllabus" or "TCS NQT
 * percentage questions" wants the topics linked, and until 2026-10-30 a test
 * page named them as plain words and no aptitude topic said which patterns
 * ask it. Coding sections are never read here: they describe themselves by
 * difficulty only, since naming their tags would tell a candidate which
 * algorithm to expect (routes/mock-tests.ts).
 */
export function sectionTopics(rules: readonly DrawRule[]): Array<{ id: string; label: string }> {
  const out = new Map<string, string>();
  for (const rule of rules) {
    if (rule.topics?.length) {
      for (const id of rule.topics) {
        const topic = aptitudeTopic(id);
        if (topic) out.set(topic.id, topic.label);
      }
    } else if (rule.category) {
      for (const topic of APTITUDE_TOPICS) if (topic.category === rule.category) out.set(topic.id, topic.label);
    }
  }
  return [...out].map(([id, label]) => ({ id, label }));
}

export interface PatternRef {
  slug: string;
  name: string;
  company: string;
}

/**
 * Topic id → the patterns whose multiple-choice sections draw it, in the
 * order given (the tests' catalogue order). Pure, so the reverse index is
 * the same rule as the forward one.
 */
export function patternsByTopic(tests: ReadonlyArray<PatternRef & { sections: ReadonlyArray<{ kind: string; blueprint: readonly DrawRule[] }> }>): Map<string, PatternRef[]> {
  const out = new Map<string, PatternRef[]>();
  for (const t of tests) {
    const ids = new Set(t.sections.filter((s) => s.kind !== "coding").flatMap((s) => sectionTopics(s.blueprint).map((x) => x.id)));
    for (const id of ids) out.set(id, [...(out.get(id) ?? []), { slug: t.slug, name: t.name, company: t.company }]);
  }
  return out;
}
