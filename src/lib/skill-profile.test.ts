import { test } from "node:test";
import assert from "node:assert/strict";
import { dayStartMs, type Attempt, type Difficulty, type ItemHistory, type SkillCatalogue } from "./skill-score.js";
import { buildSkillProfile, mistakeMix, recommendFor, scoreAll, skillDetail, targetDifficulty, type ProblemCandidate, type ProfileInput } from "./skill-profile.js";

/**
 * The profile over the engine: which skills appear, how prerequisites read,
 * what the focus lists pick, and that "what changed this week" is explained
 * by the evidence in the week — and that activity without new evidence
 * moves activity, not skill.
 *
 * Run with: npm test
 */

const at = (day: number, mins = 0) => dayStartMs(20_000 + day) + 10 * 3_600_000 + mins * 60_000;
const NOW = at(0, 600);

const ok = (t: number): Attempt => ({ at: t, outcome: "accepted", passRatio: 1 });
const wa = (t: number, passRatio = 0.2): Attempt => ({ at: t, outcome: "wrong", passRatio });

let n = 0;
const problem = (skills: string[], difficulty: Difficulty, attempts: Attempt[], extra: Partial<ItemHistory> = {}): ItemHistory => {
  const id = `p${++n}`;
  return { source: "problem", id, title: `Problem ${id}`, href: `/problems/${id}`, difficulty, skills, attempts, ...extra };
};

const catalogue = (keys: string[], count = 40): Map<string, SkillCatalogue> => new Map(keys.map((k) => [k, { source: "problem", count, points: count * 2 }]));

const input = (items: ItemHistory[], over: Partial<ProfileInput> = {}): ProfileInput => ({
  items,
  assessments: [],
  catalogue: catalogue(["dsa:arrays", "dsa:recursion", "dsa:trees", "dsa:hash-table", "dsa:two-pointers"]),
  problems: [],
  asOf: NOW,
  ...over,
});

test("only skills the catalogue can evidence appear, each rolled into its area and domain", () => {
  const p = buildSkillProfile(input([problem(["dsa:arrays"], "medium", [ok(at(-1))])]));
  const keys = p.view.skills.map((s) => s.key).sort();
  assert.deepEqual(keys, ["dsa:arrays", "dsa:hash-table", "dsa:recursion", "dsa:trees", "dsa:two-pointers"]);
  assert.ok(p.view.areas.every((a) => a.total > 0));
  const dsa = p.view.domains.find((d) => d.key === "dsa")!;
  assert.equal(dsa.total, 5);
  assert.equal(dsa.started, 1);
  assert.ok(dsa.mastery > 0 && dsa.mastery < p.view.skills.find((s) => s.key === "dsa:arrays")!.mastery);
  assert.ok(!p.view.domains.some((d) => d.key === "sql"), "a domain with nothing measurable is left out");
});

test("a weak prerequisite is named on a struggling skill, and holds back an unstarted one", () => {
  const p = buildSkillProfile(
    input([
      problem(["dsa:trees"], "medium", [wa(at(-3)), wa(at(-3, 5))]),
      problem(["dsa:trees"], "medium", [wa(at(-2))]),
      problem(["dsa:arrays"], "easy", [ok(at(-1))]),
    ]),
  );
  const trees = p.scored.get("dsa:trees")!;
  assert.deepEqual(trees.blockedBy, ["dsa:recursion"]);
  assert.ok(trees.score.indicators.some((i) => i.code === "prerequisite_gap" && /Recursion \(0%\)/.test(i.message)));
  // Arrays has no prerequisites, so it is never held back.
  assert.deepEqual(p.scored.get("dsa:arrays")!.blockedBy, []);
  // Everything else leans on arrays at 30+, and one easy solve is not that:
  // nothing is "ready", but the started skill is there to keep building.
  assert.deepEqual(p.view.focus.ready, []);
  assert.deepEqual(p.view.focus.building, ["dsa:arrays"]);
  assert.ok(p.view.focus.weakest.includes("dsa:trees"));

  // Three mediums in arrays and the topics that lean only on it open up.
  const later = buildSkillProfile(input(Array.from({ length: 3 }, () => problem(["dsa:arrays"], "medium", [ok(at(-1))]))));
  assert.ok(later.view.focus.ready.includes("dsa:recursion"));
  assert.ok(later.view.focus.ready.includes("dsa:hash-table"));
  assert.ok(!later.view.focus.ready.includes("dsa:trees"), "trees still waits on recursion");
});

test("what moved this week is explained by the week's own evidence", () => {
  const p = buildSkillProfile(
    input([
      problem(["dsa:arrays"], "easy", [ok(at(-20))]),
      problem(["dsa:arrays"], "medium", [ok(at(-2))]),
      problem(["dsa:arrays"], "medium", [wa(at(-1)), ok(at(-1, 20))], { hintsAt: at(-1, 5) }),
      problem(["dsa:two-pointers"], "medium", [wa(at(-1))]),
    ]),
  );
  const change = p.changes.find((c) => c.key === "dsa:arrays")!;
  assert.ok(change.delta > 0);
  assert.match(change.reasons[0], /^Solved 2 medium problems, 1 with help, 1 on the first try\.$/);
  const tp = p.changes.find((c) => c.key === "dsa:two-pointers");
  assert.equal(tp, undefined, "an unaccepted attempt alone does not move mastery");
});

test("a quiet week shows as retention falling, not as a mystery", () => {
  const p = buildSkillProfile(input(Array.from({ length: 6 }, () => problem(["dsa:arrays"], "medium", [ok(at(-10))]))));
  const change = p.changes.find((c) => c.key === "dsa:arrays")!;
  assert.ok(change.delta < 0);
  assert.match(change.reasons.join(" "), /No practice for 10 days/);
});

test("activity is not skill: forty re-submissions of solved problems move activity only", () => {
  const forty = buildSkillProfile(input([problem(["dsa:arrays"], "medium", [ok(at(-30)), ...Array.from({ length: 40 }, (_, i) => ok(at(-1, i)))])]));
  assert.equal(forty.view.activity.attempts7d, 40);
  assert.equal(forty.view.activity.solved7d, 0);
  // Solving it again after a month is a review and restores retention —
  // once. The other thirty-nine submissions that day add nothing.
  const once = buildSkillProfile(input([problem(["dsa:arrays"], "medium", [ok(at(-30)), ok(at(-1))])]));
  const delta = (p: typeof once) => p.changes.find((c) => c.key === "dsa:arrays")?.delta ?? 0;
  assert.equal(delta(forty), delta(once));
  assert.match(forty.changes.find((c) => c.key === "dsa:arrays")!.reasons.join(" "), /again after a gap/);
});

test("the mistake mix counts failed attempts by what the judge reported", () => {
  const items = [
    problem(["dsa:arrays"], "medium", [wa(at(-1), 0.9), wa(at(-1, 1), 0.95), { at: at(-1, 2), outcome: "timeout", passRatio: 0.5 }, ok(at(-1, 3))]),
    problem(["dsa:arrays"], "easy", [{ at: at(-1, 4), outcome: "compile" }]),
    { ...problem(["apt:quantitative"], "easy", [wa(at(-1))]), source: "aptitude" as const },
  ];
  const mix = mistakeMix(items, at(-30), NOW);
  assert.equal(mix.total, 4, "multiple-choice answers are not judged code");
  assert.deepEqual(
    mix.classes.map((c) => [c.class, c.count]),
    [
      ["EDGE_CASE", 2],
      ["COMPLEXITY", 1],
      ["SYNTAX", 1],
    ],
  );
  assert.equal(mix.classes[0].share, 0.5);
});

test("recommendations finish what was started, then pick the difficulty the skill's level calls for", () => {
  assert.equal(targetDifficulty(10), "easy");
  assert.equal(targetDifficulty(50), "medium");
  assert.equal(targetDifficulty(80), "hard");

  const cand = (id: string, difficulty: Difficulty, number: number, skills = ["dsa:arrays"]): ProblemCandidate => ({ id, slug: id, title: id, difficulty, number, skills });
  const problems = [cand("e1", "easy", 1), cand("e2", "easy", 2), cand("m1", "medium", 3), cand("h1", "hard", 4), cand("m2", "medium", 5, ["dsa:arrays", "dsa:trees"])];
  const items: ItemHistory[] = [
    { source: "problem", id: "e1", title: "e1", href: "/problems/e1", difficulty: "easy", skills: ["dsa:arrays"], attempts: [ok(at(-1))] },
    { source: "problem", id: "h1", title: "h1", href: "/problems/h1", difficulty: "hard", skills: ["dsa:arrays"], attempts: [wa(at(-1))] },
  ];
  const inp = input(items, { problems });
  const scored = scoreAll(inp, NOW);
  const recs = recommendFor("dsa:arrays", scored, inp, 3).map((r) => r.slug);
  assert.equal(recs.includes("e1"), false, "a solved problem is never recommended");
  // Arrays is low (one easy), so Easy first; the started Hard is beyond reach and waits.
  assert.deepEqual(recs, ["e2", "m1", "m2"]);
  assert.ok(recommendFor("dsa:arrays", scored, inp, 5).findIndex((r) => r.slug === "m2") > recommendFor("dsa:arrays", scored, inp, 5).findIndex((r) => r.slug === "m1"), "a problem that is also a first look at an unready skill comes later");
});

test("a skill is a weak spot or a strength, never both, and a strength is at least halfway", () => {
  const p = buildSkillProfile(
    input([
      ...Array.from({ length: 3 }, () => problem(["dsa:arrays"], "medium", [ok(at(-1))])),
      problem(["dsa:recursion"], "easy", [ok(at(-1))]),
      problem(["dsa:recursion"], "easy", [wa(at(-1))]),
    ]),
  );
  const { weakest, strongest } = p.view.focus;
  assert.ok(weakest.every((k) => !strongest.includes(k)));
  for (const k of strongest) assert.ok(p.scored.get(k)!.score.mastery >= 50, `${k} is listed as a strength`);
  assert.ok(!strongest.includes("dsa:recursion"));
});

test("a skill's detail lists its evidence newest first, its prerequisites and what it unlocks", () => {
  const p = buildSkillProfile(
    input([problem(["dsa:recursion"], "easy", [ok(at(-5))]), problem(["dsa:recursion"], "medium", [wa(at(-1)), ok(at(-1, 10))])]),
  );
  const d = skillDetail(p, "dsa:recursion")!;
  assert.equal(d.evidence.length, 2);
  assert.equal(d.evidence[0].difficulty, "medium");
  assert.equal(d.evidence[0].attempts, 2);
  assert.deepEqual(d.prerequisites.map((r) => r.key), ["dsa:arrays"]);
  assert.ok(d.unlocks.some((u) => u.key === "dsa:trees"));
  assert.equal(skillDetail(p, "dsa:graph"), null, "a skill outside the catalogue has no detail");
});
