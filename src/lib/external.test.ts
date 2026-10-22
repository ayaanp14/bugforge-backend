import { test } from "node:test";
import assert from "node:assert/strict";
import { dayOf, dayStartMs, REVIEW_LADDER_DAYS } from "./skill-score.js";
import { isDue, matchProblem, normaliseTags, parsePageProblem, parseSolve, rankedPath, revise, titleKey, verdictOf, type RevisionState } from "./external.js";

/**
 * The browser extension's rules (lib/external.ts): which pages count as
 * ranked play, how a LeetCode problem finds ours, what a reported solve may
 * carry, and the per-problem revision ladder.
 *
 * Run with: npm test
 */

test("contests, assessments and timed interviews are ranked play; a problem page is not", () => {
  assert.equal(rankedPath("https://leetcode.com/contest/weekly-contest-420/problems/two-sum/"), true);
  assert.equal(rankedPath("https://leetcode.com/assessment/abc/"), true);
  assert.equal(rankedPath("https://leetcode.com/interview/xyz"), true);
  assert.equal(rankedPath("https://leetcode.cn/contest/biweekly-1/"), true);
  assert.equal(rankedPath("https://leetcode.com/problems/two-sum/"), false);
  assert.equal(rankedPath("https://leetcode.com/problems/contest-thing/"), false);
  assert.equal(rankedPath(null), false);
  assert.equal(rankedPath("not a url"), false);
});

test("a problem matches ours by slug, else by one exact title — never loosely", () => {
  const cat = [
    { id: "a", slug: "two-sum", title: "Two Sum" },
    { id: "b", slug: "two-sum-ii", title: "Two Sum II - Input Array Is Sorted" },
    { id: "c", slug: "dup-1", title: "Same Name" },
    { id: "d", slug: "dup-2", title: "Same Name" },
  ];
  assert.equal(matchProblem(cat, "two-sum", null)?.id, "a");
  assert.equal(matchProblem(cat, "two-sum-ii-input-array-is-sorted", "Two Sum II – Input Array Is Sorted")?.id, "b");
  assert.equal(matchProblem(cat, "three-sum", "3Sum"), null);
  // Two of ours share the title: which one is unknowable, so neither.
  assert.equal(matchProblem(cat, "same-name-x", "Same Name"), null);
  assert.equal(titleKey("Pow(x, n)"), "pow x n");
});

test("a reported solve is cleaned: slug, title, at most twelve tags, a date not in the future", () => {
  const now = Date.UTC(2026, 9, 21);
  const ok = parseSolve({ slug: "two-sum", title: "  Two   Sum ", difficulty: "Easy", tags: ["Array", "Array", "Hash Table", 7], at: now + 86_400_000 }, now);
  assert.ok(typeof ok !== "string");
  assert.equal(ok.title, "Two Sum");
  assert.deepEqual(ok.tags, ["Array", "Hash Table"]);
  assert.equal(ok.difficulty, "easy");
  assert.equal(ok.at, now);
  assert.equal(typeof parseSolve({ slug: "Two Sum", title: "x" }, now), "string");
  assert.equal(typeof parseSolve({ slug: "two-sum" }, now), "string");
  assert.deepEqual(normaliseTags(["Binary Tree", "Tree", "Array"]), ["Tree", "Array"]);
});

test("the page's problem needs a title and a statement, and is clipped", () => {
  assert.equal(parsePageProblem({ title: "x" }), null);
  const p = parsePageProblem({ title: "Two Sum", statement: "s".repeat(20_000), examples: [{ input: "a", output: "b" }, {}, { input: "c" }, { input: "d" }] });
  assert.ok(p);
  assert.equal(p.statement.length, 12_000);
  assert.equal(p.examples.length, 2, "empty examples dropped, at most three read");
});

test("LeetCode's verdicts read as the judge's; an accept is not a failure", () => {
  assert.equal(verdictOf("Wrong Answer"), "WRONG_ANSWER");
  assert.equal(verdictOf("Time Limit Exceeded"), "TIME_LIMIT_EXCEEDED");
  assert.equal(verdictOf("Runtime Error"), "RUNTIME_ERROR");
  assert.equal(verdictOf("Compile Error"), "COMPILATION_ERROR");
  assert.equal(verdictOf("Accepted"), null);
});

test("the revision ladder: track, climb on or after the due day, forgetting drops to the first rung", () => {
  const day = (n: number, h = 10) => dayStartMs(21_000 + n) + h * 3_600_000;
  const fresh: RevisionState = { track: false, stage: -1, nextReviewAt: null, lastReviewedAt: null };

  // Untracked problems never move.
  assert.equal(revise(fresh, { kind: "accepted", at: day(5) }), fresh);

  let s = revise(fresh, { kind: "track", at: day(0), solvedAt: day(0) });
  assert.equal(s.stage, 0);
  assert.equal(dayOf(s.nextReviewAt!), 21_000 + REVIEW_LADDER_DAYS[0]!);
  assert.equal(isDue(s, day(1)), false);
  assert.equal(isDue(s, day(2, 0)), true, "due from the start of the due day");

  // A re-solve the next morning is not recall.
  assert.equal(revise(s, { kind: "accepted", at: day(1) }), s);

  s = revise(s, { kind: "accepted", at: day(3) });
  assert.equal(s.stage, 1);
  assert.equal(dayOf(s.nextReviewAt!), 21_003 + REVIEW_LADDER_DAYS[1]!);

  s = revise(s, { kind: "forgot", at: day(4) });
  assert.equal(s.stage, 0);
  assert.equal(dayOf(s.nextReviewAt!), 21_005, "back tomorrow");

  // Tracking an old solve makes it due already.
  const old = revise(fresh, { kind: "track", at: day(100), solvedAt: day(0) });
  assert.equal(isDue(old, day(100)), true);

  const off = revise(s, { kind: "untrack" });
  assert.equal(off.track, false);
  assert.equal(isDue(off, day(400)), false);
});
