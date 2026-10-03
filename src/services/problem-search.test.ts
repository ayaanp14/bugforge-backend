import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CatalogueRow } from "./dashboard.js";

process.env["TELEMETRY_DISABLED"] = "true";
const { createProblemSearch, fulltextStatement } = await import("./problem-search.js");

/*
 * The search service around lib/problem-search: the full-text read is cached
 * by its terms (so a repeat or the next scroll page costs no statement),
 * never cached when it fails, skipped when no term can be in the index, and
 * built with every value bound. No database: the read is a counting stub,
 * and REDIS_URL is unset in tests, so the cache is the in-process tier.
 *
 * Run with: npx tsx --test src/services/problem-search.test.ts
 */

const row = (id: string, title: string, tags: string[]): CatalogueRow => ({ id, title, slug: id, difficulty: "EASY", tags, createdAt: new Date(2026, 0, 1), timeLimitMs: 2000 });
const CATALOGUE: CatalogueRow[] = [
  row("a", "Two Sum", ["Array", "Amazon"]),
  row("b", "Climbing Stairs", ["Dynamic Programming", "Google"]),
  row("c", "Word Ladder", ["String", "Amazon"]),
  row("t", "Beautiful Towers", ["Array", "Stack"]),
];

let run = 0;
function harness(fulltext: (terms: readonly string[]) => Promise<Array<[string, number, number]>>) {
  const calls: string[][] = [];
  const search = createProblemSearch({
    catalogue: async () => CATALOGUE,
    fulltext: async (terms) => {
      calls.push([...terms]);
      return fulltext(terms);
    },
    // Each test its own keys: the in-process cache is shared by the file.
    cacheKey: `problem-search:test:${run++}:`,
  });
  return { search, calls };
}

describe("createProblemSearch", () => {
  it("reads the statement index once per term set: a repeat is a cache hit, new terms a miss", async () => {
    const { search, calls } = harness(async () => [["b", 1.5, 1]]);
    const first = await search("staircase");
    const again = await search("staircase");
    assert.deepEqual(first.map((r) => r.title), ["Climbing Stairs"]);
    assert.deepEqual(again, first);
    assert.equal(calls.length, 1, "the second search came from the cache");
    await search("ladder");
    assert.deepEqual(calls, [["staircase"], ["ladder"]]);
  });

  it("answers from titles, topics and companies when the full-text read fails, and does not cache the failure", async () => {
    let fail = true;
    const { search, calls } = harness(async () => {
      if (fail) throw new Error("Can't find FULLTEXT index matching the column list");
      return [["b", 2, 1]];
    });
    const warn = console.warn;
    console.warn = () => {};
    try {
      assert.deepEqual((await search("two sum")).map((r) => r.title), ["Two Sum"]);
      assert.deepEqual((await search("amazon")).map((r) => r.id), ["a", "c"]);
      assert.deepEqual(await search("staircase"), [], "a statement-only match is what is lost");
    } finally {
      console.warn = warn;
    }
    fail = false;
    assert.deepEqual((await search("staircase")).map((r) => r.title), ["Climbing Stairs"], "the next search tried again");
    assert.ok(calls.length >= 4);
  });

  it("sends no statement when no word can be in the index", async () => {
    const { search, calls } = harness(async () => []);
    assert.deepEqual((await search("dp")).map((r) => r.title), ["Climbing Stairs"]);
    await search("of");
    assert.equal(calls.length, 0);
  });
});

describe("fulltextStatement", () => {
  it("binds every term; the SQL text carries no part of the query", () => {
    const terms = ["drop", "table", "problem"];
    const sql = fulltextStatement(terms);
    for (const t of terms) assert.ok(!sql.sql.includes(t), `"${t}" is in the SQL text`);
    assert.ok(sql.values.includes("drop* table* problem*"));
    assert.ok(sql.values.includes("table*"));
    assert.match(sql.sql, /MATCH\(title, description\) AGAINST \(\? IN BOOLEAN MODE\)/);
    assert.match(sql.sql, /MAX_EXECUTION_TIME\(1500\)/);
    assert.match(sql.sql, /isPublished = 1/);
  });

  it("asks for one relevance and one bit per term", () => {
    const sql = fulltextStatement(["two", "sum"]);
    assert.equal((sql.sql.match(/AGAINST/g) ?? []).length, 4, "relevance, filter, and a bit for each of two terms");
    assert.ok(sql.values.includes(1) && sql.values.includes(2));
  });
});

describe("typo correction in the service", () => {
  it("prefers the correction when the query as typed is only matched loosely", async () => {
    // "tow" starts a word of "Beautiful Towers", whose statement says "sum":
    // complete as typed, but no title holds both words — "two sum" does.
    const { search } = harness(async (terms) => {
      const sum = terms.indexOf("sum");
      return sum >= 0 ? [["t", 1.2, 1 << sum]] : [];
    });
    assert.equal((await search("tow sum"))[0]!.title, "Two Sum");
    assert.equal((await search("towers"))[0]!.title, "Beautiful Towers", "a real word is never corrected");
  });

  it("answers a misspelt query with the corrected one's matches, only when that one matches fully", async () => {
    const { search, calls } = harness(async () => []);
    assert.deepEqual((await search("tow sum")).map((r) => r.title), ["Two Sum"]);
    assert.deepEqual(calls, [["tow", "sum"], ["two", "sum"]], "the corrected terms get their own full-text read");
    assert.deepEqual((await search("wrod ladder")).map((r) => r.title), ["Word Ladder"]);
    // Nothing to correct towards: the partial match as typed.
    assert.deepEqual((await search("amazon blockchain")).map((r) => r.id), ["a", "c"]);
  });
});
