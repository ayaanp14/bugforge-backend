import { test } from "node:test";
import assert from "node:assert/strict";
import { catchUpEntry } from "./daily-contest.js";

// An entry made after submitting must look like one made first: the clock
// from the first submission, the failures already counted (security audit
// 2026-10-30 — submitting before entering was free and off the clock).

const at = (min: number) => new Date(Date.UTC(2026, 9, 30, 10, min));

test("no submission before entering: the clock starts at entry", () => {
  assert.deepEqual(catchUpEntry([]), {});
});

test("probing the hidden tests before entering is on the clock and counted", () => {
  const entry = catchUpEntry([
    { submittedAt: at(1), verdict: "WRONG_ANSWER" },
    { submittedAt: at(3), verdict: "TIME_LIMIT_EXCEEDED" },
    { submittedAt: at(4), verdict: "RUNTIME_ERROR" },
  ]);
  assert.deepEqual(entry, { startedAt: at(1), wrongAttempts: 3 });
});

test("a build failure is not a wrong attempt, but still starts the clock", () => {
  assert.deepEqual(catchUpEntry([{ submittedAt: at(2), verdict: "COMPILATION_ERROR" }]), { startedAt: at(2), wrongAttempts: 0 });
});

test("failures after the first accept count for nothing", () => {
  const entry = catchUpEntry([
    { submittedAt: at(1), verdict: "WRONG_ANSWER" },
    { submittedAt: at(5), verdict: "ACCEPTED" },
    { submittedAt: at(6), verdict: "WRONG_ANSWER" },
  ]);
  assert.deepEqual(entry, { startedAt: at(1), wrongAttempts: 1 });
});
