import { test } from "node:test";
import assert from "node:assert/strict";
import { LLD_PRACTICE, notePage } from "./cs-notes.js";
import { notesFor } from "../lib/cs-notes.js";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * A Low-Level Design note's "practise it in code" link (LLD_PRACTICE) points
 * at a lesson that exists in the lld study track, and every case study has
 * one. Run with: npm test
 */

// The track's lesson files are `NN-<lesson slug>.md` (scripts/study-plans/dsl.ts); read off disk, since src/ may not import scripts/.
const trackDir = fileURLToPath(new URL("../../scripts/study-plans/lld/", import.meta.url));
const lessons = new Set(
  readdirSync(trackDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => readdirSync(`${trackDir}/${d.name}`).filter((f) => /^\d\d-.+\.md$/.test(f)).map((f) => f.replace(/^\d\d-|\.md$/g, ""))),
);
const lldNotes = new Set(notesFor("low-level-design").map((n) => n.slug));

test("every mapped note exists and every mapped lesson is in the lld track", () => {
  for (const [note, { lesson }] of Object.entries(LLD_PRACTICE)) {
    assert.ok(lldNotes.has(note), `${note} is a Low-Level Design note`);
    assert.ok(lessons.has(lesson), `${lesson} is a lesson of the lld track`);
  }
});

test("every case study note has a code lesson; only the patterns overview goes without", () => {
  const missing = [...lldNotes].filter((n) => !LLD_PRACTICE[n]);
  assert.deepEqual(missing, ["design-patterns-in-lld"]);
});

test("the note payload carries the link, and a System Design note none", () => {
  const p = notePage("low-level-design", "design-a-parking-lot");
  assert.deepEqual(p?.practice?.codeLesson, { href: "/study-plans/lld/parking-lot-design", title: "Code a parking lot" });
  assert.equal(notePage("system-design", "load-balancing")?.practice?.codeLesson, null);
});
