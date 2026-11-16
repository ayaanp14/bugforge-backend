import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VisitorBudget, parseRunRequest } from "./compiler.js";
import { MAX_SOURCE_BYTES, MAX_STDIN_BYTES } from "./program-judge.js";

describe("parseRunRequest", () => {
  it("takes a program, its language and its input", () => {
    assert.deepEqual(parseRunRequest({ language: "python", code: "print(input())", stdin: "hi" }), {
      ok: true,
      run: { language: "python", code: "print(input())", stdin: "hi" },
    });
    // No input is an empty one.
    const parsed = parseRunRequest({ language: "java", code: "class Main {}" });
    assert.ok(parsed.ok && parsed.run.stdin === "");
  });

  it("refuses a language the judge does not run, including inherited names", () => {
    for (const language of ["cobol", "constructor", "__proto__", "", null, 7]) {
      const parsed = parseRunRequest({ language, code: "x" });
      assert.ok(!parsed.ok && parsed.status === 400, String(language));
    }
  });

  it("refuses empty code and input that is not text", () => {
    assert.ok(!parseRunRequest({ language: "python", code: "   " }).ok);
    assert.ok(!parseRunRequest({ language: "python", code: "x", stdin: { a: 1 } }).ok);
    assert.ok(!parseRunRequest(null).ok);
  });

  it("holds the program judge's size caps", () => {
    const big = parseRunRequest({ language: "python", code: "x".repeat(MAX_SOURCE_BYTES + 1) });
    assert.ok(!big.ok && big.status === 413);
    const input = parseRunRequest({ language: "python", code: "x", stdin: "y".repeat(MAX_STDIN_BYTES + 1) });
    assert.ok(!input.ok && input.status === 413);
  });
});

describe("VisitorBudget", () => {
  it("caps runs in flight, and a released place is free again", () => {
    const budget = new VisitorBudget(100, 2, () => 0);
    assert.equal(budget.take(), "ok");
    assert.equal(budget.take(), "ok");
    assert.equal(budget.take(), "busy");
    budget.release();
    assert.equal(budget.take(), "ok");
  });

  it("caps runs per clock hour, refilled when the hour turns", () => {
    let now = 3_600_000 * 10 + 5;
    const budget = new VisitorBudget(2, 10, () => now);
    assert.equal(budget.take(), "ok");
    assert.equal(budget.take(), "ok");
    assert.equal(budget.take(), "spent");
    assert.equal(budget.secondsToRefill(), 3600);
    now += 3_600_000;
    assert.equal(budget.take(), "ok");
  });

  it("never lets a stray release take the count below zero", () => {
    const budget = new VisitorBudget(10, 1, () => 0);
    budget.release();
    assert.equal(budget.take(), "ok");
    assert.equal(budget.take(), "busy");
  });
});
