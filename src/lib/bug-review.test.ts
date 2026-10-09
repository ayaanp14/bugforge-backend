import { test } from "node:test";
import assert from "node:assert/strict";
import { BugReviewSchema, buildBugReviewMessages, coerceBugReview, guardBugReview, type BugReviewContext } from "./bug-review.js";
import { BUG_RUNGS, buildBugTutorMessages } from "./bug-tutor.js";
import { RUNGS } from "./tutor.js";
import { analyzeBugFailure } from "./bug-failure.js";

const files = [
  { filePath: "src/calc.js", content: "function total(c) {\n  return c.sub - c.sub * c.pct;\n}\nmodule.exports = { total };", isEditable: true },
  { filePath: "src/const.js", content: "module.exports = { TAX: 0.08 };", isEditable: false },
];
const known = analyzeBugFailure({
  verdict: "FAILED",
  checks: [
    { name: "totals", passed: false, detail: "expected 69.12 but got -1.28", hidden: false },
    { name: "hidden one", passed: false, detail: "Hidden test failed", hidden: true },
  ],
  patch: { files: [{ file: "src/calc.js", hunks: [], added: 1, removed: 1 }], added: 1, removed: 1 },
  symptoms: null,
});
const ctx: BugReviewContext = { title: "Checkout", description: "D", bugReport: "R", logs: "L", language: "javascript", files, patchText: "-a\n+b", verdict: "FAILED", known };

test("the review reads the project and the checks — hidden ones by name only", () => {
  const [, user] = buildBugReviewMessages(ctx, "SYS");
  assert.match(user!.content, /EDITABLE FILE src\/calc\.js, lines numbered ===\n1\| function total/);
  assert.match(user!.content, /LOCKED FILE src\/const\.js \(read-only context, not the bug\)/);
  assert.match(user!.content, /- FAIL \(hidden\) hidden one\n/);
  assert.doesNotMatch(user!.content, /Hidden test failed — /);
});

test("a finding keeps a file only when it is editable, a line only when that file has it", () => {
  const raw = BugReviewSchema.parse(
    coerceBugReview({
      summary: "The discount uses the wrong base.",
      category: "symptom_patch",
      findings: [
        { kind: "fact", text: "Line 2 multiplies by pct.", file: "src/calc.js", line: 2 },
        { kind: "inference", text: "The constant is wrong.", file: "src/const.js", line: 1 },
        { kind: "suggestion", text: "Check line 99.", file: "src/calc.js", line: 99 },
        "Try a 100% coupon by hand.",
        { kind: "inference", text: "five" },
      ],
      nextStep: "```js\nconst a = 1;\nconst b = 2;\n```",
      confidence: "medium",
    }),
  );
  const g = guardBugReview(raw, ctx)!;
  assert.equal(g.category, "SYMPTOM_PATCH");
  assert.equal(g.findings.length, 4);
  assert.deepEqual([g.findings[0]!.kind, g.findings[0]!.file, g.findings[0]!.line], ["inference", "src/calc.js", 2]);
  assert.deepEqual([g.findings[1]!.file, g.findings[1]!.line], [null, null]);
  assert.equal(g.findings[2]!.line, null);
  assert.match(g.nextStep, /code left out/);
  assert.equal(guardBugReview(BugReviewSchema.parse(coerceBugReview({ category: "nonsense" })), ctx), null);
});

test("the debugging ladder lines up with the problem ladder's help and code policies", () => {
  assert.equal(BUG_RUNGS.length, RUNGS.length);
  assert.deepEqual(BUG_RUNGS.map((r) => r.help), RUNGS.map((r) => r.help));
  assert.deepEqual(BUG_RUNGS.map((r) => r.code), RUNGS.map((r) => r.code));
  assert.deepEqual(BUG_RUNGS.map((r) => r.key), ["questions", "reproduce", "trace", "locate", "plan", "outline", "fix"]);
  for (let i = 1; i < BUG_RUNGS.length; i++) assert.ok(!BUG_RUNGS[i - 1]!.material.tests || BUG_RUNGS[i]!.material.tests);
});

test("the tutor reads the visible tests' source only from Locate, and never a hidden one (it has no parameter for it)", () => {
  const base = {
    title: "T",
    description: "D",
    bugReport: "R",
    logs: null,
    language: "javascript",
    files,
    symptoms: [{ name: "totals", passed: false, detail: "expected 69.12 but got -1.28" }],
    visibleTests: [{ name: "totals", source: "assert.equal(total(cart), 69.12);" }],
    code: null,
    lastSubmission: null,
    history: [],
    message: "help",
  };
  const low = buildBugTutorMessages({ ...base, rung: 2 }, "SYS").map((m) => m.content).join("\n");
  assert.doesNotMatch(low, /assert\.equal\(total/);
  assert.match(low, /THE SHIPPED BUILD ON THE VISIBLE CHECKS/);
  const high = buildBugTutorMessages({ ...base, rung: 3, climbed: true }, "SYS").map((m) => m.content).join("\n");
  assert.match(high, /VISIBLE TESTS' SOURCE/);
  assert.match(high, /just pressed "More help"/);
  assert.match(high, /Current rung: 3 of 6 — Locate/);
});
