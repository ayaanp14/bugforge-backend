import test from "node:test";
import assert from "node:assert/strict";
import { attemptClock, codingMarks, drawPaper, drawSection, markFor, shuffle, type DrawableQuestion, type SectionPlan } from "./mock-tests.js";

/** A deterministic stand-in for Math.random, so a draw can be asserted on. */
const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const pool = (spec: Array<[string, string, string, number]>): DrawableQuestion[] => {
  const out: DrawableQuestion[] = [];
  for (const [category, topic, difficulty, count] of spec) {
    for (let i = 0; i < count; i += 1) out.push({ id: `${topic}-${difficulty}-${i}`, topic, category, difficulty });
  }
  return out;
};

const BANK = pool([
  ["quantitative", "percentages", "easy", 10],
  ["quantitative", "percentages", "medium", 10],
  ["quantitative", "percentages", "hard", 4],
  ["quantitative", "averages", "medium", 8],
  ["logical", "syllogisms", "medium", 12],
  ["verbal", "vocabulary", "easy", 15],
  ["data-interpretation", "caselets", "medium", 6],
]);

const section = (over: Partial<SectionPlan> = {}): SectionPlan => ({
  key: "s1",
  name: "Section one",
  orderIndex: 0,
  durationSec: 600,
  questionCount: 5,
  blueprint: [{ category: "quantitative", count: 5 }],
  ...over,
});

test("a section draws exactly the questions its blueprint asks for", () => {
  const { questionIds, shortfall } = drawSection(section(), BANK, new Set(), seeded(1));
  assert.equal(questionIds.length, 5);
  assert.equal(shortfall, 0);
  assert.equal(new Set(questionIds).size, 5, "no question appears twice");
});

test("a rule honours the difficulty it names", () => {
  const plan = section({ questionCount: 4, blueprint: [{ topics: ["percentages"], difficulty: "hard", count: 4 }] });
  const { questionIds } = drawSection(plan, BANK, new Set(), seeded(7));
  assert.equal(questionIds.length, 4);
  for (const id of questionIds) assert.match(id, /^percentages-hard-/);
});

test("a rule that cannot be met at its difficulty relaxes rather than returning a short section", () => {
  // Only four hard percentages questions exist; the section wants eight.
  const plan = section({ questionCount: 8, blueprint: [{ topics: ["percentages"], difficulty: "hard", count: 8 }] });
  const { questionIds, shortfall } = drawSection(plan, BANK, new Set(), seeded(3));
  assert.equal(questionIds.length, 8, "the candidate still gets a full section");
  assert.equal(shortfall, 0);
  const hard = questionIds.filter((id) => id.includes("-hard-")).length;
  assert.equal(hard, 4, "every hard question available is used first");
});

test("a section reports a shortfall when the bank genuinely cannot fill it", () => {
  const plan = section({ questionCount: 50, blueprint: [{ topics: ["caselets"], count: 50 }] });
  const { questionIds, shortfall } = drawSection(plan, BANK, new Set(), seeded(5));
  assert.equal(questionIds.length, 6, "it takes every caselet there is");
  assert.equal(shortfall, 44);
});

test("a paper never repeats a question across its sections", () => {
  const plans: SectionPlan[] = [
    section({ key: "a", orderIndex: 0, questionCount: 12, blueprint: [{ category: "quantitative", count: 12 }] }),
    section({ key: "b", orderIndex: 1, questionCount: 12, blueprint: [{ category: "quantitative", count: 12 }] }),
  ];
  const { paper } = drawPaper(plans, BANK, seeded(11));
  const all = paper.flatMap((s) => s.questionIds);
  assert.equal(all.length, 24);
  assert.equal(new Set(all).size, 24, "the second section cannot reuse the first section's questions");
});

test("sections come back in blueprint order however they are listed", () => {
  const plans: SectionPlan[] = [
    section({ key: "second", orderIndex: 1, blueprint: [{ category: "verbal", count: 5 }] }),
    section({ key: "first", orderIndex: 0, blueprint: [{ category: "logical", count: 5 }] }),
  ];
  const { paper } = drawPaper(plans, BANK, seeded(2));
  assert.deepEqual(paper.map((s) => s.key), ["first", "second"]);
});

test("two sittings of the same pattern draw different papers", () => {
  const plans = [section({ questionCount: 10, blueprint: [{ category: "quantitative", count: 10 }] })];
  const a = drawPaper(plans, BANK, seeded(1)).paper[0].questionIds;
  const b = drawPaper(plans, BANK, seeded(999)).paper[0].questionIds;
  assert.notDeepEqual(a, b);
});

test("shuffle keeps every element", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];
  const out = shuffle(items, seeded(42));
  assert.deepEqual([...out].sort((x, y) => x - y), items);
  assert.notEqual(items, out, "the input is not mutated");
});

/* ── coding sections ───────────────────────────────────────────────── */

const PROBLEMS: DrawableQuestion[] = [
  ...Array.from({ length: 6 }, (_, i) => ({ id: `p-easy-${i}`, topic: "", category: "coding", difficulty: "easy", tags: ["Array"] })),
  ...Array.from({ length: 8 }, (_, i) => ({ id: `p-med-${i}`, topic: "", category: "coding", difficulty: "medium", tags: ["Graph", "Dynamic Programming"] })),
  ...Array.from({ length: 2 }, (_, i) => ({ id: `p-hard-${i}`, topic: "", category: "coding", difficulty: "hard", tags: ["Dynamic Programming"] })),
];

test("a coding section draws from the problem pool, not the question bank", () => {
  const plans: SectionPlan[] = [
    section({ key: "code", kind: "coding", questionCount: 3, blueprint: [{ difficulty: "medium", count: 3 }] }),
  ];
  const { paper } = drawPaper(plans, BANK, seeded(4), PROBLEMS);
  assert.equal(paper[0].kind, "coding");
  assert.equal(paper[0].questionIds.length, 3);
  for (const id of paper[0].questionIds) assert.match(id, /^p-med-/);
});

test("a coding rule can select on a problem's tags", () => {
  const plans: SectionPlan[] = [
    section({ key: "code", kind: "coding", questionCount: 2, blueprint: [{ topics: ["Graph"], count: 2 }] }),
  ];
  const { paper } = drawPaper(plans, BANK, seeded(6), PROBLEMS);
  for (const id of paper[0].questionIds) assert.match(id, /^p-med-/, "only the medium problems carry the Graph tag");
});

test("a mixed paper keeps its two pools apart", () => {
  const plans: SectionPlan[] = [
    section({ key: "mcq", orderIndex: 0, questionCount: 6, blueprint: [{ category: "quantitative", count: 6 }] }),
    section({ key: "code", orderIndex: 1, kind: "coding", questionCount: 3, blueprint: [{ difficulty: "easy", count: 3 }] }),
  ];
  const { paper, shortfalls } = drawPaper(plans, BANK, seeded(8), PROBLEMS);
  assert.equal(shortfalls.length, 0);
  assert.equal(paper[0].kind, "mcq");
  assert.equal(paper[1].kind, "coding");
  for (const id of paper[0].questionIds) assert.ok(!id.startsWith("p-"), "the mcq section drew no problems");
  for (const id of paper[1].questionIds) assert.match(id, /^p-easy-/);
});

test("a coding section carries its marks through to the paper", () => {
  const plans: SectionPlan[] = [
    section({ key: "code", kind: "coding", marksPerQuestion: 10, questionCount: 2, blueprint: [{ difficulty: "easy", count: 2 }] }),
  ];
  const { paper } = drawPaper(plans, BANK, seeded(9), PROBLEMS);
  assert.equal(paper[0].marksPerQuestion, 10);
});

test("a coding shortfall is reported rather than silently padded from the wrong pool", () => {
  const plans: SectionPlan[] = [
    section({ key: "code", kind: "coding", questionCount: 5, blueprint: [{ difficulty: "hard", count: 5 }] }),
  ];
  const { paper, shortfalls } = drawPaper(plans, BANK, seeded(10), PROBLEMS);
  // Only two hard problems exist; the relaxation may fill from the rest of the
  // problem pool but must never reach into the aptitude bank.
  for (const id of paper[0].questionIds) assert.match(id, /^p-/);
  assert.ok(paper[0].questionIds.length + (shortfalls[0]?.missing ?? 0) === 5);
});

test("coding marks are awarded per test case", () => {
  assert.equal(codingMarks(0, 10, 10), 0);
  assert.equal(codingMarks(10, 10, 10), 10);
  assert.equal(codingMarks(5, 10, 10), 5);
  assert.equal(codingMarks(1, 3, 10), 3.33, "rounded to two places");
  assert.equal(codingMarks(0, 0, 10), 0, "a problem with no cases scores nothing rather than dividing by zero");
});

/* ── the clock ─────────────────────────────────────────────────────── */

const at = (offsetSec: number) => new Date(Date.now() + offsetSec * 1000);

test("a running sitting reports the seconds it has left", () => {
  const clock = attemptClock({
    status: "in-progress",
    expiresAt: at(600),
    sectionEndsAt: at(120),
    sectionalTiming: true,
  });
  assert.ok(Math.abs(clock.paperRemainingSec - 600) <= 1);
  assert.ok(Math.abs(clock.sectionRemainingSec - 120) <= 1);
  assert.equal(clock.paperExpired, false);
  assert.equal(clock.sectionExpired, false);
});

test("a lapsed section is flagged while the paper still has time", () => {
  const clock = attemptClock({
    status: "in-progress",
    expiresAt: at(600),
    sectionEndsAt: at(-5),
    sectionalTiming: true,
  });
  assert.equal(clock.sectionExpired, true);
  assert.equal(clock.paperExpired, false);
  assert.equal(clock.sectionRemainingSec, 0);
});

test("a freely timed paper ignores the section deadline", () => {
  const clock = attemptClock({
    status: "in-progress",
    expiresAt: at(300),
    sectionEndsAt: at(-60),
    sectionalTiming: false,
  });
  assert.equal(clock.sectionExpired, false, "there is no section clock to lapse");
  assert.ok(Math.abs(clock.sectionRemainingSec - 300) <= 1, "it reports the paper's time instead");
});

test("a closed sitting is never reported as expiring again", () => {
  const clock = attemptClock({
    status: "submitted",
    expiresAt: at(-3600),
    sectionEndsAt: at(-3600),
    sectionalTiming: true,
  });
  assert.equal(clock.paperExpired, false);
  assert.equal(clock.sectionExpired, false);
});

/* ── marking ───────────────────────────────────────────────────────── */

test("a correct answer scores one mark whatever the penalty", () => {
  assert.equal(markFor(true, true, 0), 1);
  assert.equal(markFor(true, true, 0.25), 1);
});

test("a wrong answer costs the pattern's penalty and a blank costs nothing", () => {
  assert.equal(markFor(false, true, 0.25), -0.25);
  assert.equal(markFor(false, false, 0.25), 0, "an unanswered question is never penalised");
  assert.equal(markFor(false, true, 0), 0, "without negative marking a guess is free");
});
