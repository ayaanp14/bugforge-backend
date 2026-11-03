import { test } from "node:test";
import assert from "node:assert/strict";
import { CODE_CHARS, SOLUTION_ROUND, STATEMENT_CHARS, solutionBrief, solutionSection, spokenLanguage } from "./solution-interview.js";
import { ROUND_SKILL } from "./interview-skills.js";

/**
 * "Explain your solution": the brief the voice interviewer gets about the
 * problem the candidate just solved. Run with: npm test
 */

const facts = { title: "Two Sum", difficulty: "Easy", statement: "Given an array…", language: "cpp", code: "class Solution {};" };

test("the brief carries the problem, the language as spoken and the code, fenced as data", () => {
  const s = solutionSection(solutionBrief(facts));
  assert.match(s, /just solved "Two Sum" \(Easy\)/);
  assert.match(s, /accepted C\+\+ solution/);
  assert.match(s, /BEGIN CODE\nclass Solution \{\};\nEND CODE/);
  assert.match(s, /BEGIN STATEMENT\nGiven an array…\nEND STATEMENT/);
  assert.match(s, /never by reading code or line numbers aloud/);
});

test("a long statement or file is cut at a line end and marked, never dropped", () => {
  const long = Array.from({ length: 2_000 }, (_, i) => `line ${i}`).join("\n");
  const b = solutionBrief({ ...facts, statement: long, code: long });
  assert.ok(b.code.length <= CODE_CHARS + 30);
  assert.ok(b.statement.length <= STATEMENT_CHARS + 30);
  assert.match(b.code, /\n… \(cut for length\)$/);
  assert.ok(b.code.split("\n").slice(0, -1).every((l) => /^line \d+$/.test(l)), "cut between lines");
  assert.equal(solutionBrief(facts).code, facts.code, "a short file is kept whole");
});

test("the round is a coding interview skill, and unknown languages pass through", () => {
  assert.equal(ROUND_SKILL[SOLUTION_ROUND], "int:coding");
  assert.equal(spokenLanguage("python"), "Python");
  assert.equal(spokenLanguage("zig"), "zig");
});
