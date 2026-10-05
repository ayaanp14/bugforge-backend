import { test } from "node:test";
import assert from "node:assert/strict";
import { readNotes, validateNotes } from "./cs-notes.js";

/*
 * Every shipped CS note meets the bar (lib/cs-notes validateNote: lengths,
 * sections, code groups, figures placed and within limits) — the offline
 * half of `scripts/cs-notes.ts --validate`, held in CI. The links outside
 * /notes (catalogue problems, skill tests, SQL problems) and the code
 * groups' output are the script's (--validate, --run): they need the
 * catalogue and the judge.
 */

test("every shipped note parses and meets the bar", () => {
  const { notes, errors } = readNotes();
  assert.deepEqual(errors, []);
  assert.ok(notes.length >= 47, `only ${notes.length} notes read`);
  assert.deepEqual(validateNotes(notes), []);
});
