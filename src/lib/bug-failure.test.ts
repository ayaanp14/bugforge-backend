import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeBugFailure, type BugCheck } from "./bug-failure.js";
import type { Patch } from "./bug-incident.js";

const patch = (n = 1): Patch => ({ files: n ? [{ file: "src/a.js", hunks: [], added: 1, removed: 1 }] : [], added: n, removed: n });
const check = (name: string, passed: boolean, detail = "", hidden = false): BugCheck => ({ name, passed, detail, hidden });
const shipped = [
  { name: "totals", passed: false, detail: "expected 69.12 but got -1.28" },
  { name: "empty cart", passed: true, detail: "" },
];

test("nothing changed is said plainly", () => {
  const r = analyzeBugFailure({ verdict: "FAILED", checks: [check("totals", false, "expected 1 but got 2")], patch: patch(0), symptoms: shipped });
  assert.equal(r.category, "UNCHANGED");
  assert.match(r.findings[1]!.text, /No editable file differs/);
});

test("a check that passed on the shipped build and fails now is a regression — a fact", () => {
  const r = analyzeBugFailure({
    verdict: "FAILED",
    checks: [check("totals", true), check("empty cart", false, "expected 0 but got NaN")],
    patch: patch(),
    symptoms: shipped,
  });
  assert.equal(r.category, "REGRESSION");
  assert.deepEqual(r.regressions, ["empty cart"]);
  assert.deepEqual(r.fixed, ["totals"]);
  assert.ok(r.findings.some((f) => f.kind === "fact" && /passed on the shipped build/.test(f.text)));
});

test("a compile error, a crash, an edge case and a partial fix", () => {
  assert.equal(analyzeBugFailure({ verdict: "ERROR", checks: [check("t", false, "SyntaxError: Unexpected token")], patch: patch(), symptoms: null }).category, "SYNTAX");
  const crash = analyzeBugFailure({ verdict: "FAILED", checks: [check("t", false, "Cannot read property 'price' of undefined")], patch: patch(), symptoms: null });
  assert.equal(crash.category, "IMPLEMENTATION");
  assert.ok(crash.findings.some((f) => f.kind === "inference" && /Null or missing value/.test(f.text)));
  const edge = analyzeBugFailure({ verdict: "FAILED", checks: [check("totals", true), check("h1", false, "Hidden test failed", true)], patch: patch(), symptoms: shipped });
  assert.equal(edge.category, "EDGE_CASE");
  assert.match(edge.findings[0]!.text, /1 hidden check fails/);
  const partial = analyzeBugFailure({
    verdict: "FAILED",
    checks: [check("totals", true), check("empty cart", true), check("coupon 100%", false, "expected 0 but got 0.01")],
    patch: patch(),
    symptoms: [...shipped, { name: "coupon 100%", passed: false, detail: "" }],
  });
  assert.equal(partial.category, "INCOMPLETE_FIX");
});

test("a hidden check is never described beyond its name", () => {
  const r = analyzeBugFailure({ verdict: "FAILED", checks: [check("visible", true), check("secret", false, "Hidden test failed", true)], patch: patch(), symptoms: null });
  for (const f of r.findings) assert.doesNotMatch(f.text, /secret/);
  assert.equal(r.checks[1]!.detail, "Hidden test failed");
});
