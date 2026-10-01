/**
 * The skill tests: one skill at one level, and the paper it is sat on.
 *
 * A multiple-choice section draws from the private bank (./bank) for its
 * skill and level, balanced across the topics the bank holds — every topic
 * gets its share of the paper, so a sitting cannot be all strings and no
 * collections. A coding section draws from the published problem catalogue
 * by difficulty and, for a language test, must be answered in that language.
 *
 * The marks are weighted so that a credential means both halves: on a
 * language test the MCQs alone cannot reach the pass mark without some code,
 * and the code alone cannot reach distinction without the language.
 */
import type { SkillId, SkillLevel } from "../../src/lib/skill-catalog.js";

export interface SkillSectionSeed {
  key: string;
  name: string;
  kind: "mcq" | "coding";
  durationSec: number;
  questionCount: number;
  marksPerQuestion: number;
  instructions?: string;
  /** Coding only: what to draw, by difficulty. MCQ sections are balanced across the bank's topics at seed time. */
  draw?: Array<{ difficulty: "easy" | "medium" | "hard"; count: number }>;
}

export interface SkillTestSeed {
  slug: string;
  skill: SkillId;
  level: SkillLevel;
  title: string;
  blurb: string;
  passPercent: number;
  distinctionPercent: number;
  cooldownDays: number;
  validityMonths: number;
  orderIndex: number;
  sections: SkillSectionSeed[];
}

const min = (n: number) => n * 60;

/** What the questions look like, said on the section so a candidate is not surprised by the first one. */
const QUESTION_STYLE = {
  code: "Many questions show a program and ask what it prints.",
  dsa: "Some questions show a short program and ask what it returns or prints; others ask about complexity and the right structure for a job.",
  sql: "Most questions give one or two small tables and a query, and ask exactly what it returns.",
} as const;

const CONCEPTS = (count: number, minutes: number, style: keyof typeof QUESTION_STYLE = "code"): SkillSectionSeed => ({
  key: "concepts",
  name: "Concepts",
  kind: "mcq",
  durationSec: min(minutes),
  questionCount: count,
  marksPerQuestion: 1,
  instructions: `One mark a question, no negative marking. ${QUESTION_STYLE[style]} A few ask you to select every correct option, and only the exact set scores.`,
});

const CODING = (
  minutes: number,
  marks: number,
  draw: SkillSectionSeed["draw"] & object,
  language?: string,
): SkillSectionSeed => ({
  key: "coding",
  name: "Coding",
  kind: "coding",
  durationSec: min(minutes),
  questionCount: draw.reduce((n, rule) => n + rule.count, 0),
  marksPerQuestion: marks,
  draw,
  instructions: language
    ? `Write each solution in ${language}. Run checks the visible cases; Submit runs every hidden case and your best submission per problem is what counts, with partial credit for each case passed.`
    : "Use any language. Run checks the visible cases; Submit runs every hidden case and your best submission per problem is what counts, with partial credit for each case passed.",
});

const STANDARD = { passPercent: 60, distinctionPercent: 85, cooldownDays: 7, validityMonths: 24 } as const;

function languageTests(skill: SkillId, label: string, order: number): SkillTestSeed[] {
  return [
    {
      slug: `${skill}-basic`,
      skill,
      level: "basic",
      title: `${label} (Basic)`,
      blurb: `Core ${label}: the syntax, the types, the standard data structures and how code actually behaves when it runs — then one problem to solve in ${label}.`,
      ...STANDARD,
      orderIndex: order,
      sections: [CONCEPTS(25, 30), CODING(30, 15, [{ difficulty: "easy", count: 1 }], label)],
    },
    {
      slug: `${skill}-intermediate`,
      skill,
      level: "intermediate",
      title: `${label} (Intermediate)`,
      blurb: `${label} the way production code uses it: the object model, the libraries, the edge cases and the traps — then two problems to solve in ${label}.`,
      ...STANDARD,
      orderIndex: order + 1,
      sections: [
        CONCEPTS(25, 30),
        CODING(50, 12.5, [
          { difficulty: "easy", count: 1 },
          { difficulty: "medium", count: 1 },
        ], label),
      ],
    },
  ];
}

export const SKILL_TESTS: SkillTestSeed[] = [
  ...languageTests("java", "Java", 10),
  ...languageTests("python", "Python", 20),
  ...languageTests("javascript", "JavaScript", 30),
  ...languageTests("cpp", "C++", 40),
  {
    slug: "dsa-basic",
    skill: "dsa",
    level: "basic",
    title: "Problem Solving (Basic)",
    blurb: "Complexity, the core data structures and the classic techniques, asked as questions — then two easy problems in the language of your choice.",
    ...STANDARD,
    orderIndex: 50,
    sections: [CONCEPTS(15, 20, "dsa"), CODING(40, 12.5, [{ difficulty: "easy", count: 2 }])],
  },
  {
    slug: "dsa-intermediate",
    skill: "dsa",
    level: "intermediate",
    title: "Problem Solving (Intermediate)",
    blurb: "Trees, graphs, heaps, dynamic programming and the trade-offs between them — then two medium problems in the language of your choice.",
    ...STANDARD,
    orderIndex: 51,
    sections: [
      CONCEPTS(15, 20, "dsa"),
      CODING(60, 17.5, [{ difficulty: "medium", count: 2 }]),
    ],
  },
  {
    slug: "sql-basic",
    skill: "sql",
    level: "basic",
    title: "SQL (Basic)",
    blurb: "Selecting, filtering, sorting, joining and grouping: read a query against the tables given and say exactly what it returns.",
    ...STANDARD,
    orderIndex: 60,
    sections: [{ ...CONCEPTS(30, 35, "sql"), name: "Queries" }],
  },
  {
    slug: "sql-intermediate",
    skill: "sql",
    level: "intermediate",
    title: "SQL (Intermediate)",
    blurb: "Subqueries, window functions, NULL semantics, indexes, normalization and transactions — what a query returns and why a schema is shaped the way it is.",
    ...STANDARD,
    orderIndex: 61,
    sections: [{ ...CONCEPTS(30, 40, "sql"), name: "Queries" }],
  },
];

export const testDuration = (test: SkillTestSeed) => test.sections.reduce((n, s) => n + s.durationSec, 0);
export const testQuestions = (test: SkillTestSeed) => test.sections.reduce((n, s) => n + s.questionCount, 0);
export const testMaxMarks = (test: SkillTestSeed) => test.sections.reduce((n, s) => n + s.questionCount * s.marksPerQuestion, 0);
