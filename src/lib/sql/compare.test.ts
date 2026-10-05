import { test } from "node:test";
import assert from "node:assert/strict";
import { cellsEqual, compareResults } from "./compare.js";
import type { Cell, ResultSet } from "./types.js";

const rs = (columns: string[], rows: Cell[][]): ResultSet => ({ columns, rows, totalRows: rows.length, truncated: false, ms: 0 });

test("rows compare as a multiset unless the order matters", () => {
  const e = rs(["name"], [["A"], ["B"]]);
  const a = rs(["name"], [["B"], ["A"]]);
  assert.deepEqual(compareResults(e, a, false), { ok: true });
  const ordered = compareResults(e, a, true);
  assert.equal(ordered.ok, false);
  if (!ordered.ok) assert.match(ordered.reason, /wrong order/);
});

test("column names are compared case-insensitively, and named in the reason", () => {
  assert.deepEqual(compareResults(rs(["Employee"], [["A"]]), rs(["employee"], [["A"]]), false), { ok: true });
  const r = compareResults(rs(["employee"], [["A"]]), rs(["name"], [["A"]]), false);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.reason, /"employee"/);
});

test("row counts and duplicates matter", () => {
  assert.equal(compareResults(rs(["x"], [[1], [1]]), rs(["x"], [[1]]), false).ok, false);
  assert.equal(compareResults(rs(["x"], [[1], [2]]), rs(["x"], [[1], [1]]), false).ok, false);
});

test("numbers within rounding error are equal; a number equals its text", () => {
  assert.equal(cellsEqual(33.33, 33.330000000000005), true);
  assert.equal(cellsEqual(33.33, 33.3333), false);
  assert.equal(cellsEqual(5, "5"), true);
  assert.equal(cellsEqual("5.00", 5), true);
  assert.equal(cellsEqual(null, null), true);
  assert.equal(cellsEqual(null, 0), false);
  assert.equal(cellsEqual("abc", "ABC"), false);
});

test("a multiset comparison is not fooled by numbers of different spellings", () => {
  const e = rs(["a", "b"], [[1, "x"], [2.5, null]]);
  const a = rs(["a", "b"], [["2.5", null], ["1", "x"]]);
  assert.deepEqual(compareResults(e, a, false), { ok: true });
});
