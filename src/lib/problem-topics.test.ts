import { test } from "node:test";
import assert from "node:assert/strict";
import { TOPIC_HUBS, TOPIC_ORDER, companyBlurb, renamedCompanyHubSlug, topicHubByTag } from "./problem-topics.js";
import { TOPIC_ESSENTIALS } from "./topic-essentials.js";
import { isCompanyTag } from "./companies.js";

/*
 * The company hubs: a renamed company's old address moves to the new one,
 * and each hub's intro is told apart by its own most common topics
 * (2026-09-30 — the Facebook and Meta hubs listed one company twice, and
 * every company hub opened with the same paragraph but the name).
 */
test("a renamed company's old hub address moves to the new one", () => {
  assert.equal(renamedCompanyHubSlug("facebook"), "meta");
  assert.equal(renamedCompanyHubSlug("meta"), undefined);
  assert.equal(renamedCompanyHubSlug("amazon"), undefined);
});

test("a company hub's intro names its most common topics, and says nothing it cannot count", () => {
  const amazon = companyBlurb("Amazon", 914, [
    { label: "Arrays", count: 600 },
    { label: "Hash Table", count: 200 },
    { label: "Strings", count: 150 },
  ]);
  assert.match(amazon, /The most common topics among them are Arrays \(600\), Hash Table \(200\) and Strings \(150\)\./);
  assert.match(companyBlurb("Zoho", 12, [{ label: "Math", count: 5 }]), /most common topics among them are Math \(5\)\./);
  const bare = companyBlurb("Zoho", 12);
  assert.match(bare, /^12 problems the CodeKairo catalogue tags as commonly asked in Zoho's coding rounds/);
  assert.doesNotMatch(bare, /most common topics/);
  assert.match(bare, /not affiliated with/);
});

/*
 * Every topic tag has a page since 2026-10-01: a learning order that names
 * each hub once (a company's plan walks its topics in it), a sheet for each,
 * and one page per idea however many spellings the catalogue has for it.
 */
test("the learning order names every topic hub exactly once", () => {
  const slugs = TOPIC_HUBS.map((t) => t.slug);
  assert.deepEqual([...TOPIC_ORDER].sort(), [...slugs].sort());
  assert.equal(new Set(TOPIC_ORDER).size, TOPIC_ORDER.length);
});

test("every topic hub has its essentials sheet", () => {
  assert.deepEqual(TOPIC_HUBS.map((t) => t.slug).filter((s) => !TOPIC_ESSENTIALS[s]), []);
});

test("an alias tag leads to its hub and is nobody's own tag; no company is a topic", () => {
  assert.equal(topicHubByTag("Heap (Priority Queue)")?.slug, "heap");
  assert.equal(topicHubByTag("Fenwick Tree")?.slug, "binary-indexed-tree");
  const own = new Set(TOPIC_HUBS.map((t) => t.tag));
  for (const t of TOPIC_HUBS) for (const a of t.aliases ?? []) assert.ok(!own.has(a), `${a} is both an alias and a hub's tag`);
  for (const t of TOPIC_HUBS) assert.ok(!isCompanyTag(t.tag), `${t.tag} is a company`);
  for (const c of ["Oracle", "Paytm", "Swiggy", "Samsung", "PhonePe"]) assert.ok(isCompanyTag(c), `${c} is not a company tag`);
});
