import { test } from "node:test";
import assert from "node:assert/strict";
import { frontOf, isStrongStage, isWeakClearedStage, recommendedIn, routeOf, stageSkillsOf, type StageForRoute, type StageSkill } from "./roadmap-route.js";
import { walk, type RoadDefinition } from "../services/roadmap.js";

/**
 * The road against the profile: which skills a stage is about, which stages
 * open early, where the front is, the route's order and why, and that the
 * lock and the chests stay the road's own.
 *
 * Run with: npm test
 */

const skill = (key: string, mastery: number, over: Partial<StageSkill> = {}): StageSkill => ({
  key,
  label: key.replace("dsa:", "").replace(/^\w/, (c) => c.toUpperCase()),
  mastery,
  confidence: 0.8,
  due: false,
  status: mastery >= 70 ? "strong" : mastery >= 35 ? "practising" : mastery > 0 ? "learning" : "unstarted",
  ...over,
});

const stage = (id: string, status: StageForRoute["status"], skills: StageSkill[], over: Partial<StageForRoute> = {}): StageForRoute => ({
  id,
  title: id,
  tierTitle: "Foundations",
  status,
  solved: 0,
  required: 6,
  fastTrack: false,
  skills,
  ...over,
});

test("a stage is about the skills at least half its problems carry, and always its most common one", () => {
  assert.deepEqual(stageSkillsOf([["dsa:arrays"], ["dsa:arrays", "dsa:hash-table"], ["dsa:arrays"], ["dsa:arrays", "dsa:sorting"]]), ["dsa:arrays"]);
  assert.deepEqual(stageSkillsOf([["dsa:sorting", "dsa:greedy"], ["dsa:greedy"], ["dsa:sorting"], ["dsa:sorting", "dsa:greedy"]]).sort(), ["dsa:greedy", "dsa:sorting"]);
  assert.deepEqual(stageSkillsOf([["dsa:a"], ["dsa:b"], ["dsa:c"]]), ["dsa:a"], "no majority: the most common one, ties by name");
  assert.deepEqual(stageSkillsOf([]), []);
});

test("strong means every skill strong on enough evidence; weak means cleared and slipped", () => {
  assert.equal(isStrongStage([skill("dsa:arrays", 82)]), true);
  assert.equal(isStrongStage([skill("dsa:arrays", 82), skill("dsa:hash-table", 40)]), false);
  assert.equal(isStrongStage([skill("dsa:arrays", 82, { confidence: 0.2 })]), false, "one lucky Hard is not strong");
  assert.equal(isStrongStage([]), false);
  assert.equal(isWeakClearedStage(stage("s", "cleared", [skill("dsa:arrays", 30)])), true);
  assert.equal(isWeakClearedStage(stage("s", "open", [skill("dsa:arrays", 30)])), false);
});

const road: RoadDefinition = {
  tiers: [{ id: "foundations", title: "Foundations", blurb: "", rewardXp: 30, interviewCredits: 1 }],
  stages: ["arrays", "hashing", "pointers", "window"].map((key) => ({
    id: key,
    key,
    title: key,
    blurb: "",
    tier: "foundations",
    icon: "x",
    required: 2,
    problems: [0, 1, 2].map((n) => ({ id: `${key}-${n}`, slug: `${key}-${n}`, title: `${key} ${n}`, difficulty: n === 0 ? "EASY" : "MEDIUM" })),
  })),
};

test("the profile opens the road past strong stages, but clears nothing and opens no chest", () => {
  const plain = walk(road, new Set());
  assert.deepEqual(plain.map((s) => s.status), ["open", "locked", "locked", "locked"]);

  const strong = walk(road, new Set(), new Set(["arrays", "hashing"]));
  assert.deepEqual(strong.map((s) => s.status), ["open", "open", "open", "locked"]);
  assert.deepEqual(strong.map((s) => s.fastTrack), [false, true, true, false]);
  assert.ok(strong.every((s) => s.status !== "cleared"), "skipping clears nothing");

  // A strong stage after a weak, uncleared one does not open the road past it.
  const gap = walk(road, new Set(), new Set(["hashing"]));
  assert.deepEqual(gap.map((s) => s.status), ["open", "locked", "locked", "locked"]);

  // Clearing still works as it always did.
  const cleared = walk(road, new Set(["arrays-0", "arrays-1"]), new Set(["hashing"]));
  assert.deepEqual(cleared.map((s) => s.status), ["cleared", "open", "open", "locked"]);
});

test("the front is the first open stage the reader is not strong in", () => {
  const stages = [
    stage("arrays", "open", [skill("dsa:arrays", 85)]),
    stage("hashing", "open", [skill("dsa:hash-table", 78)], { fastTrack: true }),
    stage("pointers", "open", [skill("dsa:two-pointers", 20)], { fastTrack: true }),
  ];
  assert.equal(frontOf(stages), "pointers");
  assert.equal(frontOf([stage("a", "open", [skill("dsa:arrays", 90)])]), "a", "all strong: the first open one");
  assert.equal(frontOf([stage("a", "cleared", [])]), null);
});

test("the route: reviews, the front, weak cleared stages, then a skipped stage to finish", () => {
  const stages = [
    stage("arrays", "cleared", [skill("dsa:arrays", 72, { due: true })]),
    stage("hashing", "cleared", [skill("dsa:hash-table", 31)]),
    stage("strings", "open", [skill("dsa:strings", 80)]),
    stage("pointers", "open", [skill("dsa:two-pointers", 20)], { fastTrack: true, solved: 1 }),
    stage("window", "locked", [skill("dsa:sliding-window", 0)]),
  ];
  const route = routeOf(stages, frontOf(stages));
  assert.deepEqual(route.map((r) => [r.id, r.reason]), [
    ["arrays", "review"],
    ["pointers", "current"],
    ["hashing", "strengthen"],
    ["strings", "finish"],
  ]);
  assert.match(route[0]!.why, /Arrays is due for review/);
  assert.match(route[1]!.why, /Opened early/);
  assert.match(route[2]!.why, /Hash-table is at 31%/);
  assert.match(route[3]!.why, /clear it to open the Foundations chest/);
  assert.ok(!route.some((r) => r.id === "window"), "a locked stage is never on the route");
});

test("the next problem in a stage is marked by the stage's mastery, not re-sorted", () => {
  const problems = [
    { slug: "e1", difficulty: "EASY", solved: true },
    { slug: "e2", difficulty: "EASY", solved: false },
    { slug: "m1", difficulty: "MEDIUM", solved: false },
  ];
  assert.equal(recommendedIn(problems, 10), "e2");
  assert.equal(recommendedIn(problems, 50), "m1");
  assert.equal(recommendedIn(problems, 90), "e2", "no Hard left: the first unsolved");
  assert.equal(recommendedIn([{ slug: "x", difficulty: "EASY", solved: true }], 10), null);
});
