import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { NOTE_FIGURES_MIN, noteBlocks, readNotes } from "../cs-notes.js";
import { FIGURE_LIMITS } from "../lesson-figures/index.js";
import { noteFigureNames, noteFigureProblems } from "./index.js";
import { NOTE_FIGURES } from "./registry.js";

/*
 * The CS notes' figures (2026-10-05): one module per note, every figure
 * within the page's limits (the roadmap lessons' — same model, same
 * renderer), every figure placed by its note (an unplaced one is dead
 * weight in the registry and drifts from the text), at least
 * NOTE_FIGURES_MIN a note, and the lot small enough to ride in the note's
 * own payload.
 */

const { notes, errors } = readNotes();
const placedIn = (body: string) => noteBlocks(body).flatMap((b) => (b.kind === "figure" ? [b.name] : []));

test("every note has a figure module, and every module a note", () => {
  assert.deepEqual(errors, []);
  const slugs = notes.map((n) => n.slug);
  assert.deepEqual(slugs.filter((s) => !NOTE_FIGURES[s]), []);
  assert.deepEqual(Object.keys(NOTE_FIGURES).filter((s) => !slugs.includes(s)), []);
});

test("every figure passes the page's rules and is placed by its note", () => {
  const problems: string[] = [];
  for (const n of notes) {
    const placed = placedIn(n.body);
    if (placed.length < NOTE_FIGURES_MIN) problems.push(`${n.slug}: places ${placed.length} figures, needs ${NOTE_FIGURES_MIN}`);
    for (const name of placed) if (!noteFigureNames(n.slug).includes(name)) problems.push(`${n.slug}: places "${name}", which its module does not define`);
    for (const name of noteFigureNames(n.slug)) {
      problems.push(...noteFigureProblems(n.slug, name));
      if (!placed.includes(name)) problems.push(`${n.slug}: figure "${name}" is defined but never placed`);
    }
  }
  assert.deepEqual(problems, []);
  assert.equal(FIGURE_LIMITS.maxWidth, 600);
});

test("figures are deterministic and light on the wire", () => {
  for (const n of notes) {
    let total = 0;
    for (const name of noteFigureNames(n.slug)) {
      const make = NOTE_FIGURES[n.slug][name];
      const once = JSON.stringify(make());
      assert.equal(JSON.stringify(make()), once, `${n.slug}/${name} is not deterministic`);
      const gz = gzipSync(once).length;
      assert.ok(gz <= 6_144, `${n.slug}/${name} is ${gz} bytes gzipped`);
      total += gz;
    }
    // The lessons' budget: a note's text is ~10 KB gzipped, and its figures may cost about twice that again.
    assert.ok(total <= 24_576, `${n.slug}'s figures are ${total} bytes gzipped together`);
  }
});
