import { test } from "node:test";
import assert from "node:assert/strict";
import { longestRun, topPercentOf, wrappedOf, wrappedYear, yearBounds, type WrappedFacts, type WrappedProblem } from "./wrapped.js";

// IST instants written as local times: "2026-03-01T23:30" IST is 18:00Z.
const ist = (local: string) => new Date(new Date(`${local}:00Z`).getTime() - 330 * 60_000);

const problems = new Map<string, WrappedProblem>([
  ["p1", { title: "Two Sum", slug: "two-sum", difficulty: "Easy", tags: ["Array", "Hash Table", "Amazon"] }],
  ["p2", { title: "Coin Change", slug: "coin-change", difficulty: "Medium", tags: ["Array", "Dynamic Programming"] }],
  ["p3", { title: "Edit Distance", slug: "edit-distance", difficulty: "Hard", tags: ["String", "Dynamic Programming"] }],
]);

function facts(over: Partial<WrappedFacts> = {}): WrappedFacts {
  return {
    year: 2026,
    now: ist("2026-11-27T12:00"),
    submissions: [
      { problemId: "p1", verdict: "ACCEPTED", language: "python", at: ist("2026-03-01T23:30") },
      { problemId: "p2", verdict: "WRONG_ANSWER", language: "python", at: ist("2026-03-02T23:10") },
      { problemId: "p2", verdict: "WRONG_ANSWER", language: "python", at: ist("2026-03-02T23:20") },
      { problemId: "p2", verdict: "TIME_LIMIT_EXCEEDED", language: "python", at: ist("2026-03-02T23:40") },
      { problemId: "p2", verdict: "ACCEPTED", language: "python", at: ist("2026-03-03T00:10") },
      { problemId: "p3", verdict: "ACCEPTED", language: "java", at: ist("2026-05-10T01:00") },
    ],
    otherActivity: [{ at: ist("2026-03-04T22:30"), accepted: true }],
    firstSolves: [
      { problemId: "p1", at: ist("2026-03-01T23:30") },
      { problemId: "p2", at: ist("2026-03-03T00:10") },
      { problemId: "p3", at: ist("2026-05-10T01:00") },
    ],
    problems,
    companyTags: new Set(["Amazon"]),
    sqlSolved: 1,
    huntsFixed: 0,
    duels: { played: 2, won: 1 },
    interviewsSat: 1,
    solverCounts: [...new Array(40).fill(1), 3],
    ...over,
  };
}

test("the year's story is derived from the rows", () => {
  const w = wrappedOf(facts());
  assert.equal(w.empty, false);
  assert.equal(w.final, false);
  assert.equal(w.totals.solved, 3);
  assert.equal(w.totals.submissions, 7);
  assert.deepEqual(w.difficulty, { easy: 1, medium: 1, hard: 1 });
  assert.equal(w.months[2], 2); // March
  assert.equal(w.months[4], 1); // May
  // Company tags are never a topic; broad tags lose to a specific one.
  assert.deepEqual(w.topTopic, { name: "Dynamic Programming", solved: 2 });
  assert.deepEqual(w.situationship, { title: "Coin Change", slug: "coin-change", fails: 3, solved: true });
  assert.deepEqual(w.toxicTrait, { verdict: "WRONG_ANSWER", count: 2 });
  assert.equal(w.language?.label, "Python");
  assert.equal(w.clock?.persona, "night-owl");
  assert.equal(w.era, "Night Owl DP Era");
  assert.equal(w.hardest?.slug, "edit-distance");
  // Two of three solved on the first try.
  assert.deepEqual(w.oneShot, { count: 2, rate: 67 });
  // 1 Mar, 3 Mar, 4 Mar (the SQL accept) — 3 and 4 are a run of two.
  assert.equal(w.bestStreak, 2);
  assert.equal(w.topPercent, 3);
});

test("an empty year has no slides", () => {
  const w = wrappedOf(facts({ submissions: [], otherActivity: [], firstSolves: [] }));
  assert.equal(w.empty, true);
  assert.equal(w.clock, null);
  assert.equal(w.topPercent, null);
  assert.equal(w.era, "Fresh Grind Era");
});

test("the year closes at midnight IST", () => {
  assert.equal(wrappedOf(facts({ now: ist("2026-12-31T23:59") })).final, false);
  assert.equal(wrappedOf(facts({ now: ist("2027-01-01T00:00") })).final, true);
  assert.equal(yearBounds(2026).gte.toISOString(), "2025-12-31T18:30:00.000Z");
});

test("a rank is shown only when it says something kind", () => {
  assert.equal(topPercentOf(5, [5, 1, 1]), null); // too few solvers
  assert.equal(topPercentOf(0, new Array(50).fill(1)), null);
  assert.equal(topPercentOf(1, new Array(50).fill(3)), null); // bottom half
  assert.equal(topPercentOf(9, [9, ...new Array(99).fill(1)]), 1);
});

test("runs and years", () => {
  assert.equal(longestRun(["2026-01-01", "2026-01-02", "2026-01-04", "2026-01-05", "2026-01-06"]), 3);
  assert.equal(longestRun([]), 0);
  const now = new Date("2026-11-27T00:00:00Z");
  assert.equal(wrappedYear(undefined, now), 2026);
  assert.equal(wrappedYear("2025", now), 2025);
  assert.equal(wrappedYear("2024", now), null);
  assert.equal(wrappedYear("2027", now), null);
  assert.equal(wrappedYear("abc", now), null);
});
