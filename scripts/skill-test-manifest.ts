/**
 * Prints the SPA's copy of the skill-test catalogue — frontend
 * src/content/skill-tests.ts — from the seed source and the skill catalogue.
 *
 *   npx tsx scripts/skill-test-manifest.ts > ../frontend/src/content/skill-tests.ts
 *
 * Why the SPA holds a copy: the catalogue is content that changes with a
 * seed, not with a visitor, and the page has to be drawn before the API
 * answers — the skill cards, the paper's sections and the structured data
 * the build prerenders (lib/seo/structured-data). With the copy, a page's
 * loading state is the page itself with only the reader's own standing
 * still to come, so nothing moves when the answer lands. The API stays the
 * source of truth once it has answered; rerun this after changing
 * tests.ts or a skill's label, blurb or group.
 */
import { LEVEL_LABEL, SKILL_GROUPS, SKILLS } from "../src/lib/skill-catalog.js";
import { SKILL_TESTS, testDuration, testQuestions } from "./skill-test-data/tests.js";
import { loadBank } from "./skill-test-data/bank.js";

// The topics each test's pool holds — what the API lists as "What it
// covers" (services/skill-credentials poolTopics), in the catalogue's order.
const { questions } = loadBank();
const covered = (skill: string, level: string) => {
  const held = new Set(questions.filter((q) => q.skill === skill && q.level === level).map((q) => q.topic));
  return SKILLS.find((s) => s.id === skill)!.topics.filter((t) => held.has(t.id)).map((t) => t.id);
};

const skills = SKILLS.filter((s) => SKILL_TESTS.some((t) => t.skill === s.id)).map((s) => ({
  id: s.id,
  group: s.group,
  label: s.label,
  short: s.short,
  blurb: s.blurb,
  languages: s.codingLanguages,
  topics: s.topics.map((t) => ({ id: t.id, label: t.label, practice: t.practice ?? null })),
}));

const tests = [...SKILL_TESTS]
  .sort((a, b) => a.orderIndex - b.orderIndex)
  .map((t) => ({
    slug: t.slug,
    skill: t.skill,
    level: t.level,
    levelLabel: LEVEL_LABEL[t.level],
    title: t.title,
    blurb: t.blurb,
    durationSec: testDuration(t),
    totalQuestions: testQuestions(t),
    passPercent: t.passPercent,
    distinctionPercent: t.distinctionPercent,
    cooldownDays: t.cooldownDays,
    validityMonths: t.validityMonths,
    topics: covered(t.skill, t.level),
    sections: t.sections.map((s) => ({
      key: s.key,
      name: s.name,
      kind: s.kind,
      questionCount: s.questionCount,
      durationSec: s.durationSec,
      marksPerQuestion: s.marksPerQuestion,
      instructions: s.instructions ?? null,
    })),
  }));

/** One entry a line: readable in a diff, and a quarter the size of pretty JSON. */
const json = (v: unknown[] | readonly unknown[]) => `[\n${v.map((x) => `  ${JSON.stringify(x)}`).join(",\n")},\n]`;

process.stdout.write(`/**
 * The skill-test catalogue as the SPA draws it before the API answers.
 * GENERATED — do not edit: backend \`npx tsx scripts/skill-test-manifest.ts > ../frontend/src/content/skill-tests.ts\`
 * (the script's header says why the copy exists). The API's answer replaces
 * it once it lands; the two must agree, or the page moves when it does.
 */

export type SkillGroupId = "language" | "fundamentals" | "problem-solving";

export interface ManifestSkill {
  id: string;
  group: SkillGroupId;
  label: string;
  short: string;
  blurb: string;
  /** Judge languages the coding round takes; empty means any (or no coding round). */
  languages: string[];
  /** Every topic the skill is examined on, and where to practise it. */
  topics: Array<{ id: string; label: string; practice: { label: string; href: string } | null }>;
}

export interface ManifestTest {
  slug: string;
  skill: string;
  level: string;
  levelLabel: string;
  title: string;
  blurb: string;
  durationSec: number;
  totalQuestions: number;
  passPercent: number;
  distinctionPercent: number;
  cooldownDays: number;
  validityMonths: number;
  /** The topic ids the test's pool holds, in the skill's order (the skill names them). */
  topics: string[];
  sections: Array<{ key: string; name: string; kind: "mcq" | "coding"; questionCount: number; durationSec: number; marksPerQuestion: number; instructions: string | null }>;
}

export const SKILL_GROUPS: ReadonlyArray<{ id: SkillGroupId; label: string }> = ${json(SKILL_GROUPS)};

export const MANIFEST_SKILLS: readonly ManifestSkill[] = ${json(skills)};

export const MANIFEST_TESTS: readonly ManifestTest[] = ${json(tests)};

export const manifestTest = (slug: string): ManifestTest | undefined => MANIFEST_TESTS.find((t) => t.slug === slug);
export const manifestSkill = (id: string): ManifestSkill | undefined => MANIFEST_SKILLS.find((s) => s.id === id);
`);
