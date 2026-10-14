/**
 * The first screen of a placement test page (/tests/<slug>) as data, for the
 * static-first view the Worker draws from it (frontend
 * lib/seo/views/api/test.ts; the registry and the reasons are in
 * lib/seo-views/index.ts).
 *
 * What PlacementTestDetailPage shows a visitor, in its order: the company
 * eyebrow, the name, the blurb, the "pattern and syllabus · N sample
 * questions" line, the highlight chips, the rail's numbers and its rules,
 * then the paper — every section with its count, its time and the topics
 * it draws — and the instructions. A visitor has no sittings, no camera
 * check and no simulation line (all member-only on the page), so none of
 * that is sent.
 *
 * Built in services/seo.ts testHead from the row and the samples it has
 * already loaded (2026-10-13) — no query of its own; the section select
 * there gained `instructions` and `blueprint` for it.
 */
import { aptitudeCategory, aptitudeTopic } from "../aptitude-topics.js";
import type { DrawRule } from "../mock-tests.js";
import { BREACH_LIMIT } from "../skill-tests.js";

export interface TestView {
  kind: "test";
  company: string;
  name: string;
  blurb: string;
  /** Whether the page links "The pattern and syllabus" (a guide exists). */
  guide: boolean;
  /** How many sample questions the page lists ("N sample questions"). */
  samples: number;
  highlights: string[];
  durationSec: number;
  totalQuestions: number;
  negativeMark: number;
  /** The warning that ends a sitting (lib/skill-tests BREACH_LIMIT), for the rules. */
  breachLimit: number;
  sections: Array<{ name: string; questionCount: number; durationSec: number; instructions: string | null; topics: string[] }>;
  /** The paper's instructions as safe HTML (markdownToHtml): below the first screen, drawn so a reader who scrolls during the load reads them. */
  instructions: string;
}

/**
 * What a section will ask, as GET /api/tests/:slug words it (routes/mock-tests,
 * the `topics` of each section): a coding section by its difficulty mix, an
 * MCQ section by its topics' or categories' labels. A copy of that rule —
 * the route keeps its own inline; change both together.
 */
export function sectionTopics(kind: string, blueprint: unknown): string[] {
  const rules = (blueprint ?? []) as DrawRule[];
  if (kind === "coding") return [...new Set(rules.map((rule) => `${rule.count} ${rule.difficulty ?? "mixed"}`).map((s) => s.replace(/^1 /, "one ")))];
  return [
    ...new Set(
      rules.flatMap((rule) =>
        rule.topics?.length ? rule.topics.map((id) => aptitudeTopic(id)?.label ?? id) : rule.category ? [aptitudeCategory(rule.category)?.label ?? rule.category] : [],
      ),
    ),
  ];
}

interface TestLike {
  company: string;
  name: string;
  blurb: string;
  durationSec: number;
  totalQuestions: number;
  negativeMark: number;
  highlights: string[];
  sections: Array<{ name: string; questionCount: number; durationSec: number; instructions: string | null; kind: string; blueprint: unknown }>;
}

/** The view over the loaded test row; `instructionsHtml` is its instructions through markdownToHtml. */
export function testView(t: TestLike, opts: { guide: boolean; samples: number; instructionsHtml: string }): TestView {
  return {
    kind: "test",
    company: t.company,
    name: t.name,
    blurb: t.blurb,
    guide: opts.guide,
    samples: opts.samples,
    highlights: t.highlights,
    durationSec: t.durationSec,
    totalQuestions: t.totalQuestions,
    negativeMark: t.negativeMark,
    breachLimit: BREACH_LIMIT,
    sections: t.sections.map((s) => ({ name: s.name, questionCount: s.questionCount, durationSec: s.durationSec, instructions: s.instructions, topics: sectionTopics(s.kind, s.blueprint) })),
    instructions: opts.instructionsHtml,
  };
}
