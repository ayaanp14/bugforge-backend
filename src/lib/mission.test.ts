import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_MISSION_FACTS,
  MINUTE_CHOICES,
  buildMission,
  keptOnResize,
  missionView,
  readMarks,
  slotsFor,
  type MissionCandidates,
  type ProblemPick,
  type SkillPick,
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
