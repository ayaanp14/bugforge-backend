import { test } from "node:test";
import assert from "node:assert/strict";
import { SQL_PROBLEMS, SQL_TOPICS } from "./index.js";
import { SQL_TOPIC_GUIDES, sqlTopicBySlug, sqlTopicSlug } from "./topics.js";
import { slugify } from "../slug.js";
import { sqlSitemapEntries, sqlTopicPage } from "../../services/sql-problems.js";

test("every SQL topic has one hub slug, its name slugified", () => {
  assert.deepEqual(SQL_TOPIC_GUIDES.map((g) => g.topic), [...SQL_TOPICS]);
  for (const g of SQL_TOPIC_GUIDES) {
    assert.equal(g.slug, slugify(g.topic));
    assert.equal(sqlTopicBySlug(g.slug)?.topic, g.topic);
    assert.equal(sqlTopicSlug(g.topic), g.slug);
  }
});

// /sql/<slug> is both a topic's hub and a problem's page; the topic is tried first.
test("no SQL problem's slug is a topic's hub slug", () => {
  const reserved = new Set(SQL_TOPIC_GUIDES.map((g) => g.slug));
  assert.deepEqual(SQL_PROBLEMS.filter((p) => reserved.has(p.slug)).map((p) => p.slug), []);
});

test("the frontend's copy of the slugs is the same list", async () => {
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../../../../frontend/src/lib/seo/routes.ts", import.meta.url), "utf8").catch(() => null);
  if (src === null) return; // CI checks out the backend alone
  for (const g of SQL_TOPIC_GUIDES) assert.ok(src.includes(`{ slug: "${g.slug}", name: "${g.topic}" }`), `frontend SQL_TOPIC_HUBS lacks ${g.slug}`);
});

test("a topic's hub counts every problem carrying the topic, and lists the others", () => {
  const page = sqlTopicPage("joins");
  assert.ok(page);
  const joins = SQL_PROBLEMS.filter((p) => p.topics.includes("Joins"));
  assert.equal(page.count, joins.length);
  assert.equal(page.byDifficulty.EASY + page.byDifficulty.MEDIUM + page.byDifficulty.HARD, joins.length);
  assert.deepEqual(page.problems.map((p) => p.slug), joins.map((p) => p.slug));
  assert.ok(!page.related.some((r) => r.slug === "joins"));
  assert.match(page.description, /^\d+ SQL joins practice problems with solutions: /);
  assert.equal(sqlTopicPage("two-sum"), null);
  assert.equal(sqlTopicPage(SQL_PROBLEMS[0]!.slug), null);
});

test("the sql sitemap lists the topic hubs before the problems", () => {
  const paths = sqlSitemapEntries().map((e) => e.path);
  assert.equal(paths[0], "/sql/basics");
  assert.ok(paths.includes("/sql/window-functions"));
  assert.equal(new Set(paths).size, paths.length);
});

test("every topic's description fits a search snippet and is plain text", () => {
  for (const g of SQL_TOPIC_GUIDES) {
    const page = sqlTopicPage(g.slug);
    assert.ok(page, g.slug);
    assert.ok(page.description.length <= 158, `${g.slug}: ${page.description.length} characters`);
    assert.doesNotMatch(g.focus, /[*_`~]/, g.slug);
  }
});
