import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { filterCatalogue, seededShuffle, sortCatalogue } from "./catalogue-filter.js";

/**
 * GET /api/problems answers these from memory in place of SQL. Each rule is
 * pinned to the SQL it replaced (checked against MySQL on 14 filter
 * combinations of the 1,598-problem catalogue, 2026-10-03: same rows, same
 * order).
 */

const row = (id: string, title: string, difficulty: string, tags: string[], timeLimitMs = 2000) => ({ id, title, difficulty, tags, timeLimitMs });
// Newest first, as getCatalogue returns them.
const ROWS = [
  row("c", "Two Sum", "Easy", ["Array", "Hash Table", "Amazon"]),
  row("a", "binary search", "Medium", ["Array", "Binary Search"], 1000),
  row("d", "Édit Distance", "Hard", ["String", "Dynamic Programming", "Google"]),
  row("b", "Add Two Numbers", "medium", ["Linked List", "Amazon", "Google"]),
];
const ids = (rows: Array<{ id: string }>) => rows.map((r) => r.id);

describe("catalogue filter", () => {
  it("matches difficulty case-insensitively, like the _ci collation", () => {
    assert.deepEqual(ids(filterCatalogue(ROWS, { difficulty: "MEDIUM" })), ["a", "b"]);
  });

  it("requires every tag and the company, exactly and case-sensitively, like JSON_CONTAINS", () => {
    assert.deepEqual(ids(filterCatalogue(ROWS, { tags: ["Array"], company: "Amazon" })), ["c"]);
    assert.deepEqual(ids(filterCatalogue(ROWS, { tags: ["array"] })), []);
  });

  it("applies the time limit and the reader's solved set", () => {
    assert.deepEqual(ids(filterCatalogue(ROWS, { maxTime: 1000 })), ["a"]);
    const solved = new Set(["c", "d"]);
    assert.deepEqual(ids(filterCatalogue(ROWS, { status: { want: "solved", solved } })), ["c", "d"]);
    assert.deepEqual(ids(filterCatalogue(ROWS, { status: { want: "unsolved", solved } })), ["a", "b"]);
  });

  it("sorts by date from the catalogue's order and by title ignoring case and accents", () => {
    assert.deepEqual(ids(sortCatalogue(ROWS, undefined)), ["c", "a", "d", "b"]);
    assert.deepEqual(ids(sortCatalogue(ROWS, "oldest")), ["b", "d", "a", "c"]);
    assert.deepEqual(ids(sortCatalogue(ROWS, "title-asc")), ["b", "a", "d", "c"]);
    assert.deepEqual(ids(sortCatalogue(ROWS, "title-desc")), ["c", "d", "a", "b"]);
  });
});

describe("seeded shuffle", () => {
  const all = Array.from({ length: 200 }, (_, i) => `p${i}`);

  it("gives a session the same order on every page, whatever order the ids arrive in", () => {
    assert.deepEqual(seededShuffle(all, "s1"), seededShuffle([...all].reverse(), "s1"));
  });

  it("is a permutation, and a different seed gives a different order", () => {
    const a = seededShuffle(all, "s1");
    assert.equal(new Set(a).size, all.length);
    assert.notDeepEqual(a, seededShuffle(all, "s2"));
  });
});
