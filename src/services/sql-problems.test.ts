import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesSqlSearch, pageOfSqlList, type SqlProblemRow } from "./sql-problems.js";

const row = (n: number, difficulty: SqlProblemRow["difficulty"], topics: string[]): SqlProblemRow => ({
  number: n,
  slug: `problem-${n}`,
  title: `Problem ${n}`,
  difficulty,
  topics,
  acceptance: null,
});

const problems = Array.from({ length: 250 }, (_, i) => row(i + 1, i % 3 === 0 ? "EASY" : i % 3 === 1 ? "MEDIUM" : "HARD", i % 2 ? ["Joins"] : ["Basics"]));
const list = { problems, topics: ["Basics", "Joins"], counts: { EASY: 84, MEDIUM: 83, HARD: 83 } };

test("pages the list 100 at a time and names the next offset", () => {
  const first = pageOfSqlList(list, { offset: 0, limit: 100 });
  assert.equal(first.problems.length, 100);
  assert.equal(first.problems[0]!.number, 1);
  assert.equal(first.total, 250);
  assert.equal(first.next, 100);
  const third = pageOfSqlList(list, { offset: 200, limit: 100 });
  assert.equal(third.problems.length, 50);
  assert.equal(third.next, null);
});

test("filters before paging, facets stay over the whole list", () => {
  const page = pageOfSqlList(list, { offset: 0, limit: 100, difficulty: "EASY", topic: "Basics" });
  assert.ok(page.problems.every((p) => p.difficulty === "EASY" && p.topics.includes("Basics")));
  assert.equal(page.total, 42);
  assert.equal(page.all, 250);
  assert.deepEqual(page.topics, [
    { name: "Basics", count: 125 },
    { name: "Joins", count: 125 },
  ]);
});

test("search finds a number beyond the first page", () => {
  const page = pageOfSqlList(list, { offset: 0, limit: 100, search: "#230" });
  assert.deepEqual(page.problems.map((p) => p.number), [230]);
  assert.equal(matchesSqlSearch(row(5, "EASY", ["Window Functions"]), "window problem"), true);
  assert.equal(matchesSqlSearch(row(5, "EASY", ["Joins"]), "window"), false);
});
