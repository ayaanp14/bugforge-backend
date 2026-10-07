import { test } from "node:test";
import assert from "node:assert/strict";
import { TOPIC_HUBS, TOPIC_ORDER } from "./problem-topics.js";
import { SQL_TOPICS } from "./sql-problems/index.js";
import {
  SKILLS,
  SKILL_AREAS,
  SKILL_DOMAINS,
  dependentsOf,
  dsaKey,
  skillNode,
  skillsForAptitudeCategory,
  skillsForBugHunt,
  skillsForProblemTags,
  skillsForSkillTest,
  skillsForSqlTopics,
} from "./skill-graph.js";

/**
 * The skill graph against the vocabularies it is built from: every topic
 * hub is exactly one DSA skill, every prerequisite is a real skill learned
 * earlier, and the evidence that should land on a skill does.
 *
 * Run with: npm test
 */

test("every topic hub is exactly one DSA skill, and nothing else is", () => {
  const dsa = SKILLS.filter((s) => s.domain === "dsa");
  assert.deepEqual(new Set(dsa.map((s) => s.key)), new Set(TOPIC_HUBS.map((h) => dsaKey(h.slug))));
  assert.equal(dsa.length, TOPIC_HUBS.length);
});

test("skill keys are unique, and every skill sits in a known area of its own domain", () => {
  assert.equal(new Set(SKILLS.map((s) => s.key)).size, SKILLS.length);
  const areas = new Map(SKILL_AREAS.map((a) => [a.key, a]));
  for (const s of SKILLS) {
    const area = areas.get(s.area);
    assert.ok(area, `${s.key}: unknown area ${s.area}`);
    assert.equal(area.domain, s.domain, `${s.key} is in an area of another domain`);
  }
  for (const a of SKILL_AREAS) assert.ok(SKILLS.some((s) => s.area === a.key), `area ${a.key} is empty`);
  for (const d of SKILL_DOMAINS) assert.ok(SKILLS.some((s) => s.domain === d.key), `domain ${d.key} is empty`);
});

test("every prerequisite is a real skill of the same domain, learned earlier", () => {
  const order = new Map(TOPIC_ORDER.map((slug, i) => [dsaKey(slug), i]));
  for (const s of SKILLS) {
    for (const r of s.requires) {
      const req = skillNode(r);
      assert.ok(req, `${s.key} requires unknown ${r}`);
      assert.equal(req.domain, s.domain, `${s.key} requires ${r} from another domain`);
      assert.notEqual(r, s.key);
      if (s.domain === "dsa") assert.ok(order.get(r)! < order.get(s.key)!, `${r} must come before ${s.key} in TOPIC_ORDER`);
    }
  }
});

test("the graph has no cycle (every skill can be placed after its prerequisites)", () => {
  const placed = new Set<string>();
  let progress = true;
  while (progress) {
    progress = false;
    for (const s of SKILLS) {
      if (!placed.has(s.key) && s.requires.every((r) => placed.has(r))) {
        placed.add(s.key);
        progress = true;
      }
    }
  }
  assert.equal(placed.size, SKILLS.length, `cycle among: ${SKILLS.filter((s) => !placed.has(s.key)).map((s) => s.key).join(", ")}`);
});

test("dependents are the inverse of requires", () => {
  assert.ok(dependentsOf("dsa:recursion").includes("dsa:trees"));
  assert.ok(dependentsOf("dsa:recursion").includes("dsa:dynamic-programming"));
  assert.deepEqual(dependentsOf("dsa:biconnected-component"), []);
});

test("a problem evidences the skills its topic tags name, aliases included, never its companies", () => {
  assert.deepEqual(skillsForProblemTags(["Array", "Amazon", "Hash Table", "LeetCode 1"]).sort(), ["dsa:arrays", "dsa:hash-table"]);
  assert.deepEqual(skillsForProblemTags(["Heap (Priority Queue)"]), ["dsa:heap"]);
  assert.deepEqual(skillsForProblemTags(["Fenwick Tree", "Binary Indexed Tree"]), ["dsa:binary-indexed-tree"]);
  assert.deepEqual(skillsForProblemTags(["Google"]), []);
});

test("a bug hunt evidences its layer and every bug family its tags name", () => {
  assert.deepEqual(skillsForBugHunt("database", ["Security", "netctl"]).sort(), ["debug:database", "debug:security"]);
  assert.deepEqual(skillsForBugHunt("backend", ["Overflow", "Money", "Timezones"]).sort(), ["debug:backend", "debug:numeric", "debug:time"]);
  assert.deepEqual(skillsForBugHunt("frontend", []), ["debug:frontend"]);
});

test("SQL topics, aptitude sections and skill tests each map to their skill", () => {
  assert.deepEqual(skillsForSqlTopics(["Joins", "Aggregation"]).sort(), ["sql:aggregation", "sql:joins"]);
  assert.equal(SKILLS.filter((s) => s.domain === "sql").length, SQL_TOPICS.length);
  assert.deepEqual(skillsForAptitudeCategory("quantitative"), ["apt:quantitative"]);
  assert.deepEqual(skillsForAptitudeCategory("nonsense"), []);
  assert.deepEqual(skillsForSkillTest("sql"), ["cs:dbms"]);
  assert.deepEqual(skillsForSkillTest("os"), ["cs:os"]);
  // The language tests and the DSA test certify; they are not CS-fundamentals evidence.
  assert.deepEqual(skillsForSkillTest("java"), []);
});

test("the authored catalogue is covered: nearly every problem evidences a skill, every hunt its layer", async () => {
  const { CATALOG } = (await import(new URL("../../scripts/catalog/index.ts", import.meta.url).href)) as { CATALOG: Array<{ slug: string; tags: string[] }> };
  const unmapped = CATALOG.filter((p) => skillsForProblemTags(p.tags).length === 0);
  assert.ok(unmapped.length / CATALOG.length < 0.02, `${unmapped.length} of ${CATALOG.length} problems evidence no skill: ${unmapped.slice(0, 10).map((p) => p.slug).join(", ")}`);

  const { ALL_BUGS } = (await import(new URL("../../scripts/bugs-catalog.ts", import.meta.url).href)) as { ALL_BUGS: Array<{ title: string; category: string; tags?: string[] }> };
  for (const b of ALL_BUGS) assert.ok(skillsForBugHunt(b.category, b.tags ?? []).length >= 1, `${b.title} (${b.category}) evidences no skill`);
  const classed = ALL_BUGS.filter((b) => skillsForBugHunt(b.category, b.tags ?? []).some((k) => skillNode(k)!.area === "debug.kinds"));
  assert.ok(classed.length / ALL_BUGS.length > 0.7, `only ${classed.length} of ${ALL_BUGS.length} hunts name a bug family`);
});
