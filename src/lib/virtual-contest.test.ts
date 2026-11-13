import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS, PROBLEM_RATING, START_RATING, nextRating, performance, pickProblems, problemRating, ratingTitle, type PickRow } from "./virtual-contest.js";

/** Virtual contests and the CP rating (lib/virtual-contest). Run with: npm test */

const catalogue: PickRow[] = [
  ...Array.from({ length: 6 }, (_, i) => ({ id: `e${i}`, slug: `easy-${i}`, title: `Easy ${i}`, difficulty: "Easy" })),
  ...Array.from({ length: 6 }, (_, i) => ({ id: `m${i}`, slug: `medium-${i}`, title: `Medium ${i}`, difficulty: "Medium" })),
  ...Array.from({ length: 6 }, (_, i) => ({ id: `h${i}`, slug: `hard-${i}`, title: `Hard ${i}`, difficulty: "Hard" })),
];

test("a set follows the level's mix, repeats nothing, avoids solved problems and is the same for the same seed", () => {
  const solved = new Set(["e0", "e1", "e2", "e3", "e4"]);
  const set = pickProblems(catalogue, solved, "intermediate", "c1")!;
  assert.deepEqual(set.map((p) => p.difficulty), LEVELS.intermediate.mix);
  assert.equal(new Set(set.map((p) => p.id)).size, set.length);
  assert.equal(set[0]!.id, "e5", "the only unsolved Easy");
  assert.deepEqual(pickProblems(catalogue, solved, "intermediate", "c1"), set);
  // Everything solved: it still deals, from the solved pool.
  const all = new Set(catalogue.map((p) => p.id));
  assert.equal(pickProblems(catalogue, all, "beginner", "c2")!.length, 4);
  // Not enough Hard problems for an advanced set.
  assert.equal(pickProblems(catalogue.filter((p) => p.difficulty !== "Hard"), new Set(), "advanced", "c3"), null);
});

test("the catalogue's upper-case difficulties are read (a real database stores EASY / MEDIUM / HARD)", () => {
  const stored = catalogue.map((p) => ({ ...p, difficulty: p.difficulty.toUpperCase() }));
  const set = pickProblems(stored, new Set(), "beginner", "c9");
  assert.ok(set, "a beginner set is dealt from an upper-case catalogue");
  assert.deepEqual(set!.map((p) => p.difficulty), ["EASY", "EASY", "MEDIUM", "MEDIUM"]);
  assert.equal(problemRating("HARD"), PROBLEM_RATING["Hard"]);
  assert.equal(problemRating("easy"), PROBLEM_RATING["Easy"]);
  assert.equal(problemRating("weird"), PROBLEM_RATING["Medium"]);
});

test("performance rises with solves and with speed, and stays finite at the edges", () => {
  const ratings = LEVELS.intermediate.mix.map((d) => PROBLEM_RATING[d]!);
  const none = performance(ratings, 0, 0, 120);
  const two = performance(ratings, 2, 120, 120);
  const twoFast = performance(ratings, 2, 30, 120);
  const all = performance(ratings, 5, 400, 120);
  assert.ok(none < two && two < twoFast && twoFast < all, `${none} < ${two} < ${twoFast} < ${all}`);
  assert.ok(Number.isFinite(none) && none > 0);
  assert.ok(all < 4000);
});

test("the rating moves halfway for the first three contests, then a quarter", () => {
  assert.equal(nextRating(START_RATING, 1600, 0), 1400);
  assert.equal(nextRating(1400, 1000, 3), 1300);
  assert.equal(ratingTitle(1199), "Newcomer");
  assert.equal(ratingTitle(1650), "Specialist");
  assert.equal(ratingTitle(2200), "Master");
});
