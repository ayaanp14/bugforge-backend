import { test } from "node:test";
import assert from "node:assert/strict";
import { SQL_PROBLEMS } from "../lib/sql-problems/index.js";
import type { SqlProblemSpec } from "../lib/sql-problems/types.js";
import { relatedSqlProblems } from "./sql-problems.js";

/** A spec with only what the rule reads. */
const spec = (slug: string, topics: string[]) => ({ slug, title: slug, difficulty: "EASY", topics }) as unknown as SqlProblemSpec;

test("related SQL problems share the first topic, skip prev/next and keep the list's order", () => {
  const all = [spec("a", ["Joins"]), spec("b", ["Joins"]), spec("c", ["Joins", "Dates"]), spec("d", ["Dates"]), spec("e", ["Joins"]), spec("f", ["Joins"])];
  // c (index 2): b and d are its neighbours; d is not Joins anyway.
  assert.deepEqual(relatedSqlProblems(all[2]!, all).map((p) => p.slug), ["a", "e", "f"]);
});

test("every shipped SQL problem gets at most six related problems, never itself, all on its first topic", () => {
  for (const p of SQL_PROBLEMS) {
    const related = relatedSqlProblems(p);
    assert.ok(related.length <= 6, p.slug);
    for (const r of related) {
      assert.notEqual(r.slug, p.slug);
      assert.ok(SQL_PROBLEMS.find((q) => q.slug === r.slug)!.topics.includes(p.topics[0]!), `${p.slug} → ${r.slug}`);
    }
  }
});
