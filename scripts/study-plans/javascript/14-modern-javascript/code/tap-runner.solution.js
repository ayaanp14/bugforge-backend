"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const assert = require("node:assert/strict");
const broken = new Set((lines[0] ?? "").trim().split(/[\s,]+/).filter(Boolean));
// The code under test; `broken` sabotages named functions so some tests fail.
const sum = (a, b) => (broken.has("sum") ? a - b : a + b);
const slug = (s) => (broken.has("slug") ? s.toLowerCase() : s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
const parsePort = (t) => { const n = Number(t); if (!Number.isInteger(n) || n < 1 || n > 65535) { if (broken.has("parse")) return NaN; throw new RangeError(`bad port ${t}`); } return n; };
const cases = [];
const stack = [];
const describe = (name, fn) => { stack.push(name); fn(); stack.pop(); };
const test = (name, fn) => cases.push({ name: [...stack, name].join(" > "), fn });
describe("sum", () => {
  test("adds two numbers", () => assert.equal(sum(2, 3), 5));
  test("is commutative", () => assert.equal(sum(1, 9), sum(9, 1)));
});
describe("slug", () => {
  test("lower-cases and joins with dashes", () => assert.equal(slug("Hello, World!"), "hello-world"));
  test("collapses separators", () => assert.equal(slug("a  --  b"), "a-b"));
});
describe("parsePort", () => {
  test("accepts 8080", () => assert.equal(parsePort("8080"), 8080));
  test("rejects 70000", () => assert.throws(() => parsePort("70000"), RangeError));
});
console.log("TAP version 13");
let pass = 0, fail = 0;
cases.forEach((c, i) => {
  try {
    c.fn();
    pass++;
    console.log(`ok ${i + 1} - ${c.name}`);
  } catch (err) {
    fail++;
    console.log(`not ok ${i + 1} - ${c.name}`);
    console.log("  ---");
    console.log(`  error: ${err.name}${err.code === "ERR_ASSERTION" ? "" : `: ${err.message}`}`);
    const show = (v) => (typeof v === "function" ? v.name : JSON.stringify(v));
    if ("actual" in err && err.actual !== undefined) console.log(`  actual: ${show(err.actual)}`);
    if ("expected" in err && err.expected !== undefined) console.log(`  expected: ${show(err.expected)}`);
    console.log("  ...");
  }
});
console.log(`1..${cases.length}`);
console.log(`# tests ${cases.length}`);
console.log(`# pass ${pass}`);
console.log(`# fail ${fail}`);
