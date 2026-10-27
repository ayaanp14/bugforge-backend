import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { bodyFigureProblems, definedFigures, placedFigures } from "./index.js";
import { STUDY_FIGURES } from "./registry.js";

/*
 * The study plans' figures (2026-10-27, the SQL track first): every figure
 * within the page's limits (the roadmap lessons' — same model, same
 * renderer), every one placed by its lesson (an unplaced one is dead weight
 * in the registry and drifts from the text), deterministic, and small enough
 * to ride in the lesson's own payload. Only the tracks that have figures are
 * loaded — a track is a few hundred lesson files.
 */

type Lesson = { slug: string; body: string };
type Track = { key: string; modules: Array<{ lessons: Lesson[] }> };

const trackOf = async (key: string): Promise<Track> => {
  const mod = (await import(new URL(`../../../scripts/study-plans/${key}/track.ts`, import.meta.url).href)) as Record<string, Track>;
  const track = Object.values(mod).find((v) => v && typeof v === "object" && v.key === key);
  if (!track) throw new Error(`scripts/study-plans/${key}/track.ts exports no track "${key}"`);
  return track;
};

test("every figure is placed by its lesson, and every placed figure passes the page's rules", async () => {
  const problems: string[] = [];
  for (const key of Object.keys(STUDY_FIGURES)) {
    const lessons = new Map((await trackOf(key)).modules.flatMap((m) => m.lessons).map((l) => [l.slug, l.body]));
    for (const lesson of Object.keys(STUDY_FIGURES[key]!)) if (!lessons.has(lesson)) problems.push(`${key}/${lesson}: a figure module for a lesson the track does not have`);
    for (const [lesson, body] of lessons) problems.push(...bodyFigureProblems(key, lesson, body));
    for (const { lesson, name } of definedFigures().filter((f) => f.track === key)) {
      if (!placedFigures(lessons.get(lesson) ?? "").includes(name)) problems.push(`${key}/${lesson}: figure "${name}" is defined but never placed`);
    }
  }
  assert.deepEqual(problems, []);
});

test("figures are deterministic and small", () => {
  for (const { track, lesson, name } of definedFigures()) {
    const make = STUDY_FIGURES[track]![lesson]![name]!;
    const a = JSON.stringify(make());
    assert.equal(JSON.stringify(make()), a, `${track}/${lesson} "${name}" is not deterministic`);
    const gz = gzipSync(a).length;
    assert.ok(gz <= 6 * 1024, `${track}/${lesson} "${name}" is ${gz} B gzipped (≤ 6 KB)`);
  }
});
