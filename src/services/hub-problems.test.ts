import { test } from "node:test";
import assert from "node:assert/strict";
import { HUB_PAGE_SIZE, pageOfHub } from "./problem-hubs.js";
import type { CatalogueRow } from "./dashboard.js";

/*
 * A hub's problem table (2026-10-02): 100 rows a page, easy → medium →
 * hard, narrowed by difficulty and searched over the whole hub, so the page
 * never holds the 667-problem list it used to.
 */

const levels = ["EASY", "MEDIUM", "HARD"] as const;
const rows: CatalogueRow[] = Array.from({ length: 250 }, (_, i) => ({
  id: `id${i}`,
  slug: `p${i}`,
  title: i === 7 ? "Sliding Window Maximum" : i === 42 ? "Longest Window Substring" : `Problem ${i}`,
  difficulty: levels[i % 3],
  tags: i === 42 ? ["String", "Sliding Window", "Amazon"] : ["Array", "Amazon"],
  createdAt: new Date(2026, 0, 1),
  timeLimitMs: 2000,
}));

test("pages hold 100 rows in level order and chain by offset to the end", () => {
  const first = pageOfHub(rows, { offset: 0, limit: HUB_PAGE_SIZE });
  assert.equal(first.problems.length, 100);
  assert.equal(first.total, 250);
  assert.equal(first.next, 100);
  const all = [first];
  while (all[all.length - 1].next !== null) all.push(pageOfHub(rows, { offset: all[all.length - 1].next!, limit: HUB_PAGE_SIZE }));
  assert.equal(all.length, 3);
  const slugs = all.flatMap((p) => p.problems.map((x) => x.slug));
  assert.equal(new Set(slugs).size, 250, "no row twice, none missing");
  const order = all.flatMap((p) => p.problems.map((x) => levels.indexOf(x.difficulty as (typeof levels)[number])));
  assert.deepEqual(order, [...order].sort((a, b) => a - b), "easy, then medium, then hard");
  // Catalogue order holds inside a level.
  assert.deepEqual(first.problems.slice(0, 3).map((x) => x.slug), ["p0", "p3", "p6"]);
  // Companies are not topics.
  assert.deepEqual(first.problems[0].topics, ["Array"]);
});

test("a difficulty narrows the list and its total", () => {
  const hard = pageOfHub(rows, { offset: 0, limit: HUB_PAGE_SIZE, difficulty: "HARD" });
  assert.equal(hard.total, 83);
  assert.ok(hard.problems.every((p) => p.difficulty === "HARD"));
  assert.equal(hard.next, null);
});

test("search covers the whole hub: every word in the title or a topic, any case", () => {
  const window = pageOfHub(rows, { offset: 0, limit: HUB_PAGE_SIZE, q: "WINDOW" });
  assert.deepEqual(window.problems.map((p) => p.slug).sort(), ["p42", "p7"]);
  assert.equal(window.total, 2);
  assert.equal(window.next, null);
  // "sliding" is p42's topic, "longest" its title: both words must match.
  assert.deepEqual(pageOfHub(rows, { offset: 0, limit: HUB_PAGE_SIZE, q: "longest  sliding" }).problems.map((p) => p.slug), ["p42"]);
  // A company tag is not searched as a topic.
  assert.equal(pageOfHub(rows, { offset: 0, limit: HUB_PAGE_SIZE, q: "amazon" }).total, 0);
  // Search and difficulty together.
  assert.deepEqual(pageOfHub(rows, { offset: 0, limit: HUB_PAGE_SIZE, q: "window", difficulty: "MEDIUM" }).problems.map((p) => p.slug), ["p7"]);
});
