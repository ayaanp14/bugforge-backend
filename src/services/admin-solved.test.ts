import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { firstSolves } from "./admin-solved.js";

/**
 * The admin panel's "what did this person solve" list: one entry per problem,
 * dated by the first accept, newest first. Pinned without a database.
 *
 * Run with: npm test
 */

const at = (iso: string) => new Date(iso);
type Row = { id: string; language: string; submittedAt: Date };
const fold = (rows: Row[], counts: Record<string, number> = {}) =>
  firstSolves(rows, (r) => r.id, (r) => r.language, new Map(Object.entries(counts)));

describe("firstSolves", () => {
  it("dates a problem by its first accept and lists newest solves first", () => {
    const out = fold([
      { id: "two-sum", language: "python", submittedAt: at("2026-09-01T10:00:00Z") },
      { id: "lru-cache", language: "java", submittedAt: at("2026-09-05T10:00:00Z") },
      { id: "two-sum", language: "python", submittedAt: at("2026-09-09T10:00:00Z") },
    ]);
    assert.deepEqual(out.map((s) => [s.first.id, s.first.submittedAt.toISOString()]), [
      ["lru-cache", "2026-09-05T10:00:00.000Z"],
      ["two-sum", "2026-09-01T10:00:00.000Z"],
    ]);
  });

  it("collects each language once, in the order first used", () => {
    const [s] = fold([
      { id: "p", language: "cpp", submittedAt: at("2026-09-01T00:00:00Z") },
      { id: "p", language: "python", submittedAt: at("2026-09-02T00:00:00Z") },
      { id: "p", language: "cpp", submittedAt: at("2026-09-03T00:00:00Z") },
    ]);
    assert.deepEqual(s?.languages, ["cpp", "python"]);
  });

  it("takes submissions from the all-verdict count, never below the accepts seen", () => {
    const rows: Row[] = [
      { id: "a", language: "js", submittedAt: at("2026-09-01T00:00:00Z") },
      { id: "a", language: "js", submittedAt: at("2026-09-02T00:00:00Z") },
      { id: "b", language: "js", submittedAt: at("2026-09-03T00:00:00Z") },
    ];
    const out = fold(rows, { a: 7 });
    assert.equal(out.find((s) => s.first.id === "a")?.submissions, 7);
    // No count for b (the two reads raced a new submission): the accept itself still counts.
    assert.equal(out.find((s) => s.first.id === "b")?.submissions, 1);
  });

  it("is empty for an account that never solved anything", () => {
    assert.deepEqual(fold([], { a: 3 }), []);
  });
});
