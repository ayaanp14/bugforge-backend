import { test } from "node:test";
import assert from "node:assert/strict";
import { HELD_BACK, RUNGS, TOP_RUNG, buildTutorMessages, codeGate, rungFor, rungOf, type TutorContext } from "./tutor.js";

test("the ladder: seven rungs, help counted as the rung gives it, code only from Pseudocode", () => {
  assert.deepEqual(
    RUNGS.map((r) => r.key),
    ["questions", "approach", "complexity", "hint", "pseudocode", "structure", "solution"],
  );
  assert.equal(TOP_RUNG, 6);
  assert.deepEqual(
    RUNGS.map((r) => r.help),
    ["none", "hints", "hints", "hints", "solution", "solution", "solution"],
  );
  assert.deepEqual(
    RUNGS.map((r) => r.code),
    ["none", "none", "none", "none", "pseudocode", "code", "code"],
  );
  // What the model may read only ever grows as the student climbs.
  for (let i = 1; i < RUNGS.length; i++) {
    for (const k of ["hints", "editorial", "solution"] as const) {
      assert.ok(!RUNGS[i - 1]!.material[k] || RUNGS[i]!.material[k], `${RUNGS[i]!.key} keeps ${k}`);
    }
  }
});

test("a message is answered at the rung reached, or one above it; never skipped ahead or below", () => {
  assert.deepEqual(rungFor(0, null), { rung: 0, climbed: false });
  assert.deepEqual(rungFor(2, 2), { rung: 2, climbed: false });
  assert.deepEqual(rungFor(2, 3), { rung: 3, climbed: true });
  assert.equal(rungFor(2, 4), null, "no skipping");
  assert.equal(rungFor(3, 1), null, "what was shown stays shown");
  assert.equal(rungFor(TOP_RUNG, TOP_RUNG + 1), null);
  assert.equal(rungOf(9), TOP_RUNG);
  assert.equal(rungOf(-2), 0);
  assert.equal(rungOf("3"), 0);
});

const CTX: TutorContext = {
  title: "Two Sum",
  statement: "Return the indices of the two numbers that add up to target.",
  examples: [{ input: "[2,7,11,15]\n9", output: "[0,1]" }],
  rung: 0,
  hints: ["SECRET-HINT: think about what each number needs."],
  editorial: "SECRET-EDITORIAL: one pass with a hash map.",
  solution: { language: "python", code: "SECRET-SOLUTION = {}" },
  code: "def twoSum(nums, target):\n    return []",
  language: "python",
  lastSubmission: { verdict: "WRONG_ANSWER", passed: 3, total: 50, headline: "Most cases fail", review: null },
  history: [
    { role: "student", content: "where do I start?" },
    { role: "tutor", content: "x".repeat(2_000) },
  ],
  message: "what should I try?",
};

const all = (ctx: TutorContext) =>
  buildTutorMessages(ctx, "SYSTEM")
    .map((m) => m.content)
    .join("\n");

test("the model reads the hints, the editorial and a solution only from the rungs that allow them", () => {
  for (const rung of [0, 1, 2]) {
    const text = all({ ...CTX, rung });
    assert.ok(!/SECRET-/.test(text), `rung ${rung} holds no reference material`);
  }
  const hint = all({ ...CTX, rung: 3 });
  assert.match(hint, /SECRET-HINT/);
  assert.doesNotMatch(hint, /SECRET-EDITORIAL|SECRET-SOLUTION/);
  const steps = all({ ...CTX, rung: 4 });
  assert.match(steps, /SECRET-EDITORIAL/);
  assert.doesNotMatch(steps, /SECRET-SOLUTION/);
  assert.match(all({ ...CTX, rung: 5 }), /SECRET-SOLUTION/);
});

test("the messages: stable prefix first, the code numbered, the rung's limit said again just before the question", () => {
  const messages = buildTutorMessages({ ...CTX, rung: 1 }, "SYSTEM");
  assert.deepEqual(messages[0], { role: "system", content: "SYSTEM" });
  assert.match(messages[1]!.content, /=== BEGIN STATEMENT ===/);
  assert.match(messages[1]!.content, /Expected output: \[0,1\]/);
  assert.match(messages[2]!.content, /Current rung: 1 of 6 — Approach/);
  // History: the student's line as the user, the tutor's long answer clipped.
  assert.equal(messages[3]!.role, "user");
  assert.equal(messages[4]!.role, "assistant");
  assert.ok(messages[4]!.content.length < 1_000);
  const work = messages[5]!.content;
  assert.match(work, /1\| def twoSum\(nums, target\):/);
  assert.match(work, /wrong answer, 3 of 50 cases passed/);
  assert.match(messages[6]!.content, /^Reminder — rung 1, Approach: you must not give the efficient idea/);
  assert.deepEqual(messages[7], { role: "user", content: "what should I try?" });
});

test("code the student did not share is said to be missing, not invented", () => {
  const text = all({ ...CTX, code: null, lastSubmission: null });
  assert.match(text, /has not shared code/);
  assert.doesNotMatch(text, /LAST SUBMISSION/);
});

/** Feeds the text through the gate in the given chunk sizes and returns what came out. */
const through = (rung: number, text: string, size: number) => {
  const gate = codeGate(rung);
  let out = "";
  for (let i = 0; i < text.length; i += size) out += gate.push(text.slice(i, i + size));
  return out + gate.end();
};

const ANSWER = "Look at this:\n```python\nseen = {}\nfor x in nums:\n    pass\n```\nThen compare.";

test("below Pseudocode a code block is held back, however the stream is cut", () => {
  for (const size of [1, 3, 7, ANSWER.length]) {
    assert.equal(through(0, ANSWER, size), `Look at this:\n${HELD_BACK}\nThen compare.`, `chunks of ${size}`);
  }
});

test("Pseudocode lets plain-text steps through and holds real code back", () => {
  const steps = "Steps:\n```text\n1. walk the array\n2. look up the complement\n```\nDone.";
  assert.equal(through(4, steps, 2), steps);
  assert.equal(through(4, ANSWER, 5), `Look at this:\n${HELD_BACK}\nThen compare.`);
  // An untagged block is code until it says otherwise.
  assert.equal(through(4, "A:\n```\nx = 1\n```\nB", 1), `A:\n${HELD_BACK}\nB`);
});

test("from Structure the answer passes untouched", () => {
  assert.equal(through(5, ANSWER, 4), ANSWER);
  assert.equal(through(6, ANSWER, 1), ANSWER);
});

test("text streams at once; only a line that could still open a fence waits, and inline code is text", () => {
  const gate = codeGate(0);
  assert.equal(gate.push("Hello wor"), "Hello wor", "a paragraph is not held for its own end");
  assert.equal(gate.push("ld.\n``"), "ld.\n", "two backticks at a line's start might be a fence");
  assert.equal(gate.push("`py\nx = 1\n```\nok"), `${HELD_BACK}\nok`, "the third backtick arrives later: still a fence, held");
  const inline = codeGate(0);
  assert.equal(inline.push("`seen[x]` holds the index.\n"), "`seen[x]` holds the index.\n");
  // An unclosed block at the end stays held.
  assert.equal(through(1, "Try:\n```js\nlet a = 1;", 3), `Try:\n${HELD_BACK}\n`);
});

test("a climb tells the model to give the new rung's help, not only a question", () => {
  const climbed = buildTutorMessages({ ...CTX, rung: 1, climbed: true }, "SYSTEM");
  const reminder = climbed[climbed.length - 2]!.content;
  assert.match(reminder, /just pressed "More help"/);
  assert.match(reminder, /the brute force/);
  const asked = buildTutorMessages({ ...CTX, rung: 1 }, "SYSTEM");
  assert.doesNotMatch(asked[asked.length - 2]!.content, /More help/);
});

test("an example block passes at every rung, a line at a time, and is cut at the first line of code", () => {
  const card = "Like this:\n```example\nInput: nums = [2, 7], target = 9\ni = 0 → 2, look for 7\nOutput: [0, 1]\n```\nSee?";
  for (const rung of [0, 2, 4]) {
    for (const size of [1, 4, card.length]) assert.equal(through(rung, card, size), card, `rung ${rung}, chunks of ${size}`);
  }
  const sneaky = "Look:\n```example\nInput: nums = [2, 7]\nfor x in nums:\n    seen[x] = 1\n```\nDone.";
  assert.equal(through(0, sneaky, 3), `Look:\n\`\`\`example\nInput: nums = [2, 7]\n\`\`\`\n${HELD_BACK}\nDone.`);
  // Unclosed at the end: what was fine is kept, a code line is not.
  assert.equal(through(0, "A\n```example\ni = 0 → 2", 2), "A\n```example\ni = 0 → 2");
  assert.equal(through(0, "A\n```example\nreturn seen;", 2), `A\n\`\`\`example\n\`\`\`\n${HELD_BACK}`);
});

test("the model is told when the code changed since its last reply, and when a submission is of older code", () => {
  const changed = all({ ...CTX, codeChanged: true, lastSubmission: { ...CTX.lastSubmission!, current: false } });
  assert.match(changed, /CHANGED their code/);
  assert.match(changed, /EARLIER version of the code/);
  assert.match(all({ ...CTX, codeChanged: false }), /unchanged since your last reply/);
  const first = all({ ...CTX, codeChanged: null });
  assert.doesNotMatch(first, /CHANGED|unchanged/);
  assert.doesNotMatch(first, /EARLIER version/);
});
