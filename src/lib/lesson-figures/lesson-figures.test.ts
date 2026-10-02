import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { LESSONS_DIR, allLessons, figureNamesIn } from "../roadmap-lessons.js";
import { FIGURE_LIMITS, figureNames, lessonFigureProblems } from "./index.js";
import { LESSON_FIGURES } from "./registry.js";

/*
 * The roadmap lessons' figures (2026-10-03): one module per lesson, every
 * figure within the page's limits, every figure placed by its lesson (an
 * unplaced one is dead weight in the registry and drifts), and the lot
 * small enough that a lesson's payload stays what the page can afford —
 * the figures ride in the same request as the text.
 */

const lessons = allLessons();

test("every lesson has a figure module, and every module a lesson", () => {
  const files = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_")).map((f) => f.slice(0, -3));
  assert.deepEqual(files.filter((s) => !LESSON_FIGURES[s]), []);
  assert.deepEqual(Object.keys(LESSON_FIGURES).filter((s) => !files.includes(s)), []);
});

test("every figure passes the page's rules and is placed by its lesson", () => {
  const problems: string[] = [];
  for (const l of lessons) {
    const placed = new Set(figureNamesIn(l.body));
    for (const name of figureNames(l.slug)) {
      problems.push(...lessonFigureProblems(l.slug, name));
      if (!placed.has(name)) problems.push(`${l.slug}: figure "${name}" is defined but never placed`);
    }
  }
  assert.deepEqual(problems, []);
  assert.equal(FIGURE_LIMITS.maxWidth, 600);
});

test("figures are deterministic and light on the wire", () => {
  for (const l of lessons) {
    let total = 0;
    for (const name of figureNames(l.slug)) {
      const make = LESSON_FIGURES[l.slug][name];
      const once = JSON.stringify(make());
      assert.equal(JSON.stringify(make()), once, `${l.slug}/${name} is not deterministic`);
      const gz = gzipSync(once).length;
      assert.ok(gz <= 6_144, `${l.slug}/${name} is ${gz} bytes gzipped`);
      total += gz;
    }
    // A lesson's text was ~9 KB gzipped before the figures took over from it; the figures may cost about as much again.
    assert.ok(total <= 24_576, `${l.slug}'s figures are ${total} bytes gzipped together`);
  }
});
