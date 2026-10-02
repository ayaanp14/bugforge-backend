import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { parseGuide, proseWords, readGuides, siteLinkChecker, validateGuide } from "./skill-test-guides.js";
import { TOPIC_HUBS } from "./problem-topics.js";
import { APTITUDE_CATEGORIES, APTITUDE_TOPICS } from "./aptitude-topics.js";
import { fileURLToPath } from "node:url";

// The roadmap lessons' folder (lib/roadmap-lessons LESSONS_DIR), named here
// so this test does not load every lesson figure to learn file names.
const LESSONS_DIR = fileURLToPath(new URL("../../content/roadmap/", import.meta.url));

/*
 * The skill tests' written guides (content/skill-tests/*.md): every shipped
 * file parses, keeps the bar, links only to pages that exist, and names a
 * test the seed source defines. Whether a sample is a bank question, and
 * whether a run: sample prints its key, are the seeder's checks
 * (scripts/seed-skill-tests.ts --validate / --run): they need the bank and
 * the judge.
 */

const { guides, problems } = readGuides();

test("every shipped guide parses", () => {
  assert.deepEqual(problems, []);
});

test("every guide keeps the bar and links only to real pages", async () => {
  // The tests, from the seed source (outside src/, so imported by URL: the
  // compiler need not follow it).
  const seed = (await import(new URL("../../scripts/skill-test-data/tests.ts", import.meta.url).href)) as { SKILL_TESTS: Array<{ slug: string }> };
  const slugs = new Set(seed.SKILL_TESTS.map((t) => t.slug));
  const lessons = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_")).map((f) => f.replace(/\.md$/, ""));
  const known = siteLinkChecker(slugs, TOPIC_HUBS.map((h) => h.slug), [...APTITUDE_CATEGORIES.map((c) => c.id), ...APTITUDE_TOPICS.map((t) => t.id)], lessons);
  for (const guide of guides) {
    assert.ok(slugs.has(guide.slug), `${guide.slug}.md names no skill test`);
    assert.deepEqual(validateGuide(guide, known), [], guide.slug);
  }
});

test("the parser splits the body from the sample, in the bank's grammar", () => {
  const guide = parseGuide(
    [
      "---",
      "updated: 2026-10-03",
      "question: What is on it?",
      "answer: Short.",
      "q: One?",
      "a: Yes.",
      "---",
      "",
      "## What it covers",
      "",
      "```text",
      "## Sample question",
      "```",
      "",
      "## Sample question",
      "topic: strings",
      "answer: B",
      "run: java",
      "",
      "What does this print?",
      "",
      "```java",
      "public class Main {}",
      "```",
      "",
      "- A: `1`",
      "- B: `2`",
      "- C: It does not compile.",
      "",
      "> Because.",
    ].join("\n"),
    "java-basic.md",
  );
  assert.equal(guide.slug, "java-basic");
  assert.equal(guide.skill, "java");
  assert.equal(guide.level, "basic");
  assert.match(guide.body, /## What it covers/);
  assert.match(guide.body, /## Sample question\n```/, "a heading inside a fence is the body's");
  assert.deepEqual(guide.sample.answer, [1]);
  assert.equal(guide.sample.run, "java");
  assert.equal(guide.sample.options.length, 3);
  assert.match(guide.sample.prompt, /^What does this print\?/);
  assert.equal(guide.sample.explanation, "Because.");
  assert.deepEqual(guide.faq, [{ q: "One?", a: "Yes." }]);
  // A two-word slug keeps its skill whole.
  assert.equal(parseGuide(guide.body.replace(/^/, "---\nupdated: x\n---\n") + "\n## Sample question\n\nQ?\n\n- A: a\n- B: b\n- C: c\n", "networks-intermediate.md").skill, "networks");
});

test("prose is counted without code", () => {
  assert.equal(proseWords("One two `three`.\n\n```js\nnot counted at all\n```\n\nFour [five](/x)."), 5);
});
