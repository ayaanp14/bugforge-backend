import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env["TELEMETRY_DISABLED"] = "true";
const { ACCEPTANCE_MIN_SUBMISSIONS, acceptanceRate, acceptanceTable } = await import("./problem-acceptance.js");

/*
 * The catalogue's Acceptance column (2026-10-03): accepted submissions over
 * all submissions, one decimal, and "—" (no rate) until a problem has enough
 * submissions for the number to mean anything.
 *
 * Run with: npx tsx --test src/services/problem-acceptance.test.ts
 */
describe("acceptanceRate", () => {
  it("is a percentage with one decimal", () => {
    assert.equal(acceptanceRate(20, 30), 66.7);
    assert.equal(acceptanceRate(0, 40), 0);
    assert.equal(acceptanceRate(25, 25), 100);
  });

  it("is no rate below the threshold, where one submission swings it", () => {
    assert.equal(ACCEPTANCE_MIN_SUBMISSIONS, 20);
    assert.equal(acceptanceRate(1, 1), null);
    assert.equal(acceptanceRate(19, 19), null);
    assert.equal(acceptanceRate(10, 20), 50);
  });
});

describe("acceptanceTable", () => {
  it("sums each problem's verdicts and keeps only the problems with a rate", () => {
    const table = acceptanceTable([
      { problemId: "a", verdict: "ACCEPTED", count: 12 },
      { problemId: "a", verdict: "WRONG_ANSWER", count: 20 },
      { problemId: "a", verdict: "TIME_LIMIT_EXCEEDED", count: 8 },
      { problemId: "b", verdict: "ACCEPTED", count: 3 },
      { problemId: "c", verdict: "WRONG_ANSWER", count: 25 },
    ]);
    assert.deepEqual(table, { a: 30, c: 0 });
  });
});
