import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { LESSONS_DIR, lessonBlocks, parseLesson, validateLesson, validateLessons } from "./roadmap-lessons.js";
import { TOPIC_HUBS } from "./problem-topics.js";
import { walkthroughFor } from "./walkthroughs/index.js";

/*
 * The roadmap's lessons (content/roadmap/*.md): every shipped file parses
 * and meets the bar the validator holds it to, and the body splitter that
 * both renderers depend on cuts code groups, the walkthrough marker and
 * prose where they are. The catalogue checks (practice slugs, problem
 * links) and the run on the judge are the gate script's
 * (scripts/roadmap-lessons.ts --validate / --run): they need the catalogue
 * and the network.
 */

const files = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
const lessons = files.map((f) => parseLesson(readFileSync(`${LESSONS_DIR}${f}`, "utf8"), f));

test("every shipped lesson parses and meets the bar", async () => {
  assert.ok(lessons.length > 0, "content/roadmap has no lessons");
  // The road's stage keys, from the seed source (outside src/, so imported
  // by URL: the compiler need not follow it).
  const seed = (await import(new URL("../../scripts/roadmap-data.ts", import.meta.url).href)) as { ROADMAP: Array<{ key: string }> };
  assert.deepEqual(validateLessons(lessons, seed.ROADMAP.map((s) => s.key)), []);
});

test("a lesson's hub is a topic page, and @walkthrough names one that has a figure", () => {
  const hubs = new Set(TOPIC_HUBS.map((t) => t.slug));
  for (const l of lessons) {
    if (l.hub) assert.ok(hubs.has(l.hub), `${l.slug}: hub "${l.hub}" is not a topic page`);
    if (lessonBlocks(l.body).some((b) => b.kind === "walkthrough")) assert.ok(l.hub && walkthroughFor(l.hub), `${l.slug}: @walkthrough without a figure`);
  }
});

test("the body splitter finds groups, the marker and prose — and leaves other fences in the prose", () => {
  const body = [
    "Intro paragraph.",
    "",
    "## The idea",
    "",
    "```text",
    "## not a heading",
    "```",
    "",
    "@walkthrough",
    "",
    "```cpp",
    "int main() {}",
    "```",
    "",
    "```java",
    "public class Main {}",
    "```",
    "```python",
    "print(1)",
    "```",
    "",
    "```javascript",
    "console.log(1)",
    "```",
    "",
    "```output",
    "1",
    "```",
    "",
    "## After",
    "Done.",
  ].join("\n");
  const blocks = lessonBlocks(body);
  assert.deepEqual(
    blocks.map((b) => b.kind),
    ["text", "walkthrough", "code", "text"],
  );
  const [first, walk, code, last] = blocks;
  assert.equal(first.kind === "text" && first.line, 1);
  assert.match(first.kind === "text" ? first.markdown : "", /## not a heading/);
  assert.equal(walk.line, 9);
  assert.ok(code.kind === "code");
  if (code.kind === "code") {
    assert.deepEqual(
      code.samples.map((s) => s.language),
      ["cpp", "java", "python", "javascript"],
    );
    assert.equal(code.output, "1");
    assert.equal(code.line, 11);
  }
  // A prose block starts at the blank line after the group; its heading is still body line 30.
  assert.equal(last.kind === "text" && last.line, 29);
});

test("a malformed lesson is refused with its file named", () => {
  assert.throws(() => parseLesson("no frontmatter", "x.md"), /x\.md: missing frontmatter/);
  assert.throws(() => parseLesson("---\ntitle: A\nbogus: 1\n---\nbody", "y.md"), /unknown frontmatter key "bogus"/);
  assert.throws(() => parseLesson("---\nq: Why?\n---\nbody", "z.md"), /has no "a:"/);
});

test("the bar names what is missing", () => {
  const thin = parseLesson(
    [
      "---",
      "title: Thin",
      "stage: arrays",
      "order: 1",
      "minutes: 1",
      "level: Beginner",
      "practice: a, b",
      "updated: 2026-10-02",
      "seo-title: Thin",
      "description: Short.",
      "question: What?",
      "answer: Little.",
      "---",
      "# A heading the page owns",
      "",
      "```cpp",
      "int main() {}",
      "```",
    ].join("\n"),
    "thin.md",
  );
  const problems = validateLesson(thin).join("\n");
  for (const want of [/seo-title is too short/, /description is \d+ characters/, /the answer is \d+ words/, /0 q\/a pairs/, /2 practice problems/, /"# " heading/, /words of prose/, /a code group must be cpp, java, python, javascript/, /needs an "output" fence/]) {
    assert.match(problems, want);
  }
});

test("a figure line is a block of its own, and the bar checks it is placed properly", () => {
  const blocks = lessonBlocks(["Intro.", "", "@figure two-shapes", "", "More.", "@figure Bad Name"].join("\n"));
  assert.deepEqual(
    blocks.map((b) => (b.kind === "figure" ? `figure:${b.name}@${b.line}` : b.kind)),
    ["text", "figure:two-shapes@3", "text"],
  );
  // A real lesson's figures (two-pointers.md is the reference set), then the same body with its markers broken.
  const ref = lessons.find((l) => l.slug === "two-pointers");
  assert.ok(ref, "two-pointers.md is the reference lesson");
  assert.deepEqual(validateLesson(ref), []);
  const broken = { ...ref, body: ref.body.replace("\n\n@figure growth", "\n@figure growth").replace("@figure fast-slow", "@figure no-such-figure") };
  const problems = validateLesson(broken).join("\n");
  assert.match(problems, /"@figure growth" needs a blank line before and after it/);
  assert.match(problems, /no figure "no-such-figure"/);
  const bare = { ...ref, body: ref.body.replace(/^@(figure [a-z-]+|walkthrough)$/gm, "") };
  assert.match(validateLesson(bare).join("\n"), /0 figures; a lesson needs at least 4/);
});
