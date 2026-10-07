import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_MISSION_FACTS,
  MAX_PER_SKILL,
  MINUTE_CHOICES,
  activityKey,
  buildMission,
  keptOnResize,
  missionView,
  readItems,
  readMarks,
  slotsFor,
  type MissionCandidates,
  type ProblemPick,
  type SkillPick,
  type TargetCandidates,
} from "./mission.js";
import type { Difficulty } from "./skill-score.js";

/**
 * Today's mission: how many items a day holds, which candidates win the
 * slots and in what order, what fits the minutes, and how ticks are read.
 * The candidates are written by hand; services/mission.ts gathers the real
 * ones from the skill profile, the plan and the dashboard's loads.
 *
 * Run with: npm test
 */

let n = 0;
const prob = (difficulty: Difficulty = "easy"): ProblemPick => ({ id: `p${++n}`, slug: `p${n}`, title: `Problem ${n}`, difficulty });
const skill = (label: string, over: Partial<SkillPick> = {}): SkillPick => ({
  key: `dsa:${label.toLowerCase()}`,
  label,
  mastery: 20,
  problems: [prob("easy"), prob("medium"), prob("easy")],
  lesson: null,
  status: "learning",
  ...over,
});

const EMPTY: MissionCandidates = {
  goal: null,
  level: null,
  finish: null,
  due: [],
  weakest: [],
  building: [],
  ready: [],
  hunts: [],
  daily: null,
  studyLesson: null,
  milestone: null,
  fallback: [],
  target: null,
};
const cands = (over: Partial<MissionCandidates> = {}): MissionCandidates => ({ ...EMPTY, fallback: Array.from({ length: 12 }, () => prob("easy")), ...over });

test("the day's size is the minutes alone, and grows with them", () => {
  const sizes = MINUTE_CHOICES.map(slotsFor);
  assert.deepEqual(sizes, [...sizes].sort((a, b) => a - b), "never fewer items for more time");
  assert.equal(slotsFor(60), 3);
  for (const m of MINUTE_CHOICES) assert.equal(buildMission(cands(), m).length, slotsFor(m), `${m} min`);
});

test("an empty account still gets a full day from the catalogue", () => {
  const day = buildMission(cands(), 60);
  assert.equal(day.length, 3);
  assert.ok(day.every((i) => i.kind === "practice" && i.workbench));
});

test("priorities: the unfinished draft, then a due review, then the weakest skill", () => {
  const finish = prob("medium");
  const day = buildMission(cands({ finish, due: [skill("Hashing")], weakest: [skill("Graph")], building: [skill("Stack")] }), 60);
  assert.deepEqual(day.map((i) => i.kind), ["finish", "review", "practice"]);
  assert.equal(day[0]!.evidence && "problemId" in day[0]!.evidence ? day[0]!.evidence.problemId : null, finish.id);
  assert.equal(day[2]!.context, "Graph");
  assert.match(day[1]!.why, /Hashing is due for review/);
});

test("no problem appears twice, even when two skills recommend it", () => {
  const shared = prob("easy");
  const day = buildMission(cands({ due: [skill("Arrays", { problems: [shared] })], weakest: [skill("Hashing", { problems: [shared, prob("easy")] })] }), 90);
  const ids = day.flatMap((i) => (i.evidence && "problemId" in i.evidence ? [i.evidence.problemId] : []));
  assert.equal(new Set(ids).size, ids.length);
});

test("a short day prefers an easier problem over one that will not fit", () => {
  const hardFirst = skill("Graph", { problems: [prob("hard"), prob("easy")] });
  const short = buildMission(cands({ weakest: [hardFirst] }), 15);
  assert.equal(short[0]!.difficulty, "easy");
  const long = buildMission(cands({ weakest: [hardFirst] }), 120);
  assert.ok(long.some((i) => i.difficulty === "hard"), "a long day takes the recommendation as it is");
});

test("the plan's next step is on the day when there is room, and a full mock waits for a long day", () => {
  const aptitude = { key: "aptitude", title: "Try an aptitude section", detail: "Quant, logical and verbal.", href: "/aptitude" };
  const mock = { key: "mock", title: "Sit the TCS mock", detail: "Timed like the real paper.", href: "/tests/tcs" };
  assert.ok(buildMission(cands({ milestone: aptitude }), 60).some((i) => i.kind === "milestone"));
  assert.ok(!buildMission(cands({ milestone: mock }), 60).some((i) => i.kind === "milestone"));
  assert.ok(buildMission(cands({ milestone: mock }), 120).some((i) => i.kind === "milestone"));
  // Practice steps of the plan (a roadmap stage, today's problem) are not listed twice.
  assert.ok(!buildMission(cands({ milestone: { ...aptitude, key: "roadmap" } }), 120).some((i) => i.kind === "milestone"));
});

test("a goal moves its own work forward: a language learner starts in the language, a practiser on today's problem", () => {
  const studyLesson = { key: "java:variables", title: "Variables", href: "/study-plans/java/variables", trackTitle: "Java", behind: 0 };
  const lang = buildMission(cands({ goal: "language", studyLesson, weakest: [skill("Arrays")] }), 30);
  assert.ok(lang.some((i) => i.kind === "lesson"));
  const daily = prob("medium");
  const practice = buildMission(cands({ goal: "practice", daily, weakest: [skill("Arrays")] }), 30);
  assert.ok(practice.some((i) => i.kind === "challenge"));
  const placements = buildMission(cands({ goal: "placements", daily, weakest: [skill("Arrays")], due: [skill("Strings")] }), 30);
  assert.ok(!placements.some((i) => i.kind === "challenge"), "on a short day the interview goals practise their weak spots first");
});

test("a tutorial is offered for a skill being learned, on a day long enough to read it", () => {
  const withLesson = skill("Two Pointers", { status: "unstarted", lesson: { slug: "two-pointers-technique", title: "Two Pointers Technique", minutes: 12 } });
  const day = buildMission(cands({ ready: [withLesson] }), 60);
  const learn = day.find((i) => i.kind === "learn");
  assert.ok(learn);
  assert.equal(learn.href, "/roadmap/two-pointers-technique");
  assert.equal(learn.evidence, null, "a roadmap lesson keeps no read record: ticked by hand");
  assert.ok(!buildMission(cands({ ready: [withLesson] }), 30).some((i) => i.kind === "learn"));
});

test("the day is drawn in learning order: finish, review, learn, practise, then the bigger steps", () => {
  const day = buildMission(
    cands({
      finish: prob("easy"),
      due: [skill("Hashing")],
      weakest: [skill("Graph", { lesson: { slug: "graphs", title: "Graphs", minutes: 12 } })],
      hunts: [{ id: "h1", title: "Totals off by one", href: "/bug-hunts/totals", difficulty: "easy", skill: "debug:numeric", skillLabel: "Numbers & money" }],
      milestone: { key: "resume", title: "Check your resume", detail: "An ATS score.", href: "/resume" },
      goal: "placements",
    }),
    120,
  );
  const order = ["finish", "review", "learn", "lesson", "practice", "debug", "challenge", "milestone"];
  const kinds = day.map((i) => i.kind);
  assert.deepEqual(kinds, [...kinds].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
  assert.ok(kinds.includes("debug"));
  assert.ok(kinds.includes("milestone"));
});

test("ticks come from evidence; only a hand-ticked item needs a mark; skipped items leave the count", () => {
  const p = prob("easy");
  const lesson = skill("Graph", { status: "unstarted", lesson: { slug: "graphs", title: "Graphs", minutes: 12 } });
  const items = buildMission(cands({ finish: p, ready: [lesson] }), 60);
  const learn = items.find((i) => i.kind === "learn")!;
  const other = items.find((i) => i.kind === "practice")!;

  const fresh = missionView("2026-10-07", 60, items, {}, EMPTY_MISSION_FACTS);
  assert.equal(fresh.done, 0);
  assert.equal(fresh.current, items[0]!.id);
  assert.equal(fresh.items.find((i) => i.id === learn.id)!.manual, true);

  const solved = { ...EMPTY_MISSION_FACTS, solvedProblems: new Set([p.id]) };
  const later = missionView("2026-10-07", 60, items, { [learn.id]: "done", [other.id]: "skipped" }, solved);
  assert.equal(later.done, 2);
  assert.equal(later.total, 2, "the skipped item is out of the count");
  assert.equal(later.items[0]!.by, "evidence");
  assert.equal(later.items.find((i) => i.id === learn.id)!.by, "hand");
  assert.equal(later.complete, true);
  assert.equal(later.current, null);
});

test("changing the minutes keeps what is done and re-picks the rest to the new size", () => {
  const p = prob("easy");
  const c = cands({ finish: p, weakest: [skill("Graph")] });
  const items = buildMission(c, 90);
  const kept = keptOnResize(items, {}, { ...EMPTY_MISSION_FACTS, solvedProblems: new Set([p.id]) });
  assert.equal(kept.length, 1);
  const shorter = buildMission(c, 30, kept);
  assert.equal(shorter.length, slotsFor(30));
  assert.ok(shorter.some((i) => i.id === kept[0]!.id), "the done item stays");
  // More done than the new size holds: nothing done is ever dropped.
  const many = items.slice(0, 3);
  assert.equal(buildMission(c, 15, many).length, 3);
});

test("stored marks are read defensively", () => {
  assert.deepEqual(readMarks({ a: "done", b: "skipped", c: "maybe", d: 3 }), { a: "done", b: "skipped" });
  assert.deepEqual(readMarks(null), {});
  assert.deepEqual(readMarks(["done"]), {});
});

test("one skill takes at most two of the day's items", () => {
  const arrays = skill("Arrays", { lesson: { slug: "arrays", title: "Arrays", minutes: 12 } });
  const day = buildMission(cands({ due: [arrays], building: [arrays], weakest: [] }), 90);
  assert.equal(day.filter((i) => i.skill === arrays.key).length, 2);
  assert.equal(day.length, slotsFor(90), "the rest of the day is filled from elsewhere");
});

// ── The placement target ──────────────────────────────────────────

const target = (over: Partial<TargetCandidates> = {}): TargetCandidates => ({
  company: "TCS",
  daysLeft: 10,
  areas: ["assessment", "coding", "fundamentals", "interview", "resume"],
  mock: { slug: "tcs-nqt", name: "TCS NQT" },
  aptitude: { category: "logical", label: "Logical Reasoning", mastery: 35 },
  coding: [skill("Hashing", { mastery: 30 })],
  fundamentals: { key: "cs:os", label: "Operating systems", mastery: 0, notesHref: "/notes/operating-systems", test: { slug: "os-basic", title: "Operating Systems Basic" } },
  doneToday: new Set(),
  ...over,
});

test("a target never changes the day's size", () => {
  for (const daysLeft of [null, 3, 90]) {
    for (const m of MINUTE_CHOICES) {
      const day = buildMission(cands({ target: target({ daysLeft }), due: [skill("Arrays")], weakest: [skill("Graph")] }), m);
      assert.equal(day.length, slotsFor(m), `${m} min, ${daysLeft} days`);
    }
  }
});

test("near the drive, the weakest area leads: a full mock on a day that holds it, its weakest section otherwise", () => {
  const c = cands({ target: target(), due: [skill("Arrays")], weakest: [skill("Graph")] });
  const short = buildMission(c, 60);
  assert.ok(!short.some((i) => i.href === "/tests/tcs-nqt"), "an hour's mock does not fit an hour's day beside two more items");
  const apt = short.find((i) => i.href === "/aptitude/logical");
  assert.ok(apt, "the paper's weakest section stands in");
  assert.equal(apt.kind, "practice");
  assert.match(apt.why, /^10 days to TCS: Logical Reasoning is the weakest section/);
  assert.deepEqual(apt.evidence, { activity: "aptitude", ref: "logical" });
  // Two slots: the target and the review — ahead of the weakest skill.
  assert.deepEqual(buildMission(c, 30).map((i) => i.context), ["Arrays", "Logical Reasoning"]);

  const long = buildMission(c, 120);
  const mock = long.find((i) => i.href === "/tests/tcs-nqt");
  assert.ok(mock, "a two-hour day sits the mock");
  assert.equal(mock.kind, "target");
  assert.equal(mock.minutes, 60);
  assert.ok(long.some((i) => i.href === "/aptitude/logical"), "and comes back to the area for its second item");
});

test("far from the drive, or with no date, the target is one item after the plan's step", () => {
  const c = (daysLeft: number | null) => cands({ target: target({ daysLeft }), due: [skill("Arrays")], weakest: [skill("Graph")] });
  for (const daysLeft of [null, 90]) {
    const short = buildMission(c(daysLeft), 30);
    assert.ok(!short.some((i) => i.evidence && "activity" in i.evidence), "a short day keeps its review and weakest skill");
    const long = buildMission(c(daysLeft), 90);
    const items = long.filter((i) => (i.evidence && "activity" in i.evidence) || i.href.startsWith("/aptitude"));
    assert.equal(items.length, 1, "one target item, not two");
    assert.doesNotMatch(items[0]!.why, /days to/, "no countdown when the drive is not near");
  }
});

test("the coding area puts the company's weakest topic before the generic weakest skill", () => {
  const day = buildMission(cands({ target: target({ areas: ["coding"] }), weakest: [skill("Graph")] }), 15);
  assert.equal(day.length, 1);
  assert.equal(day[0]!.context, "Hashing");
  assert.match(day[0]!.why, /Hashing is the weakest topic TCS's problems use, at 30%/);
  // Never "at 0%": a section or topic never touched is named as such.
  const untouched = buildMission(cands({ target: target({ areas: ["assessment"], aptitude: { category: "verbal", label: "Verbal Ability", mastery: 0 } }) }), 15)[0]!;
  assert.equal(untouched.why, "10 days to TCS: Verbal Ability is a section of TCS's test you have not practised yet.");
});

test("fundamentals: the skill test on a day that holds it, else the notes, ticked by hand", () => {
  const c = cands({ target: target({ areas: ["fundamentals"] }) });
  const long = buildMission(c, 90).filter((i) => i.skill === "cs:os");
  // The test, and — the area's second item near the drive — the notes, read first.
  assert.deepEqual(long.map((i) => i.href), ["/notes/operating-systems", "/skill-tests/os-basic"]);
  assert.match(long[1]!.why, /no test sitting yet/);
  const short = buildMission(c, 60).filter((i) => i.skill === "cs:os");
  assert.deepEqual(short.map((i) => i.href), ["/notes/operating-systems"]);
  assert.equal(short[0]!.evidence, null);
  // In its cooldown the test is not offered at all: the notes, whatever the day.
  const cooling = cands({ target: target({ areas: ["fundamentals"], fundamentals: { ...target().fundamentals!, test: null } }) });
  assert.equal(buildMission(cooling, 240).find((i) => i.skill === "cs:os")!.href, "/notes/operating-systems");
});

test("interview practice and the resume are items of their own when they have most to gain", () => {
  const interview = buildMission(cands({ target: target({ areas: ["interview"] }) }), 60).find((i) => i.href === "/mock-interview");
  assert.ok(interview);
  assert.deepEqual(interview.evidence, { activity: "interview", ref: null });
  assert.ok(!buildMission(cands({ target: target({ areas: ["interview"] }) }), 45).some((i) => i.href === "/mock-interview"), "half an hour of interview needs room beside two more items");
  const resume = buildMission(cands({ target: target({ areas: ["resume"] }) }), 15)[0]!;
  assert.equal(resume.title, "Resume check for TCS");
});

test("what was done today is not set again, and the next thing on the area's list is", () => {
  const day = buildMission(cands({ target: target({ doneToday: new Set([activityKey("aptitude", "logical")]) }) }), 60);
  assert.ok(!day.some((i) => i.href === "/aptitude/logical"));
  assert.ok(day.some((i) => i.context === "Hashing"), "the assessment's coding fallback");
});

test("a target item and the plan's step for the same thing are not both on the day", () => {
  const mockStep = { key: "mock", title: "Sit the TCS mock", detail: "Timed like the real paper.", href: "/tests/tcs-nqt" };
  const day = buildMission(cands({ target: target({ areas: ["assessment"] }), milestone: mockStep }), 120);
  assert.equal(day.filter((i) => i.href === "/tests/tcs-nqt").length, 1);
  assert.equal(day.find((i) => i.href === "/tests/tcs-nqt")!.kind, "target");
});

test("the target's skills still keep to their share of the day", () => {
  const arrays = skill("Arrays");
  const day = buildMission(cands({ target: target({ areas: ["coding"], coding: [arrays] }), due: [arrays], weakest: [arrays] }), 120);
  assert.equal(day.filter((i) => i.skill === arrays.key).length, MAX_PER_SKILL);
});

test("activity items are ticked by what was done today, and survive a round trip through storage", () => {
  const items = buildMission(cands({ target: target({ areas: ["interview"] }) }), 60);
  const stored = readItems(JSON.parse(JSON.stringify(items)));
  assert.equal(stored.length, items.length);
  const id = stored.find((i) => i.href === "/mock-interview")!.id;
  const view = missionView("2026-10-07", 60, stored, {}, { ...EMPTY_MISSION_FACTS, activities: new Set(["interview"]) });
  const row = view.items.find((i) => i.id === id)!;
  assert.equal(row.state, "done");
  assert.equal(row.by, "evidence");
  assert.equal(row.manual, false);
});
