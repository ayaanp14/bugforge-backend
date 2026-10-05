import type { Cell, ResultSet } from "./types.js";

/**
 * Is a learner's result the expected one? The rules LeetCode's database
 * problems taught everyone to expect, written down:
 *
 *  - the same columns, by name (case-insensitive) and in order — the
 *    statement's output table names them, and an interviewer reading
 *    `SELECT name AS employee` reads the alias too;
 *  - the same rows, as a multiset unless the problem says the order matters
 *    (`ordered`), in which case row by row;
 *  - numbers equal within one part in a million (absolute below 1), so 33.33
 *    from ROUND and 33.330000000000005 from floating arithmetic are one
 *    answer, while an unrounded 33.3333 against a rounded 33.33 is not;
 *  - a number and its decimal text are equal ('5' = 5): MySQL and SQLite
 *    disagree on which a CAST or a CONCAT returns, and the learner should
 *    not pay for that;
 *  - NULL equals only NULL.
 *
 * Pure; pinned by compare.test.ts.
 */

export type Comparison = { ok: true } | { ok: false; reason: string };

const NUMERIC = /^\s*-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?\s*$/i;

/** The number a cell stands for, if it stands for one. */
function asNumber(c: Cell): number | null {
  if (typeof c === "number") return c;
  if (typeof c === "string" && NUMERIC.test(c)) return Number(c);
  return null;
}

export function cellsEqual(a: Cell, b: Cell): boolean {
  if (a === null || b === null) return a === b;
  const x = asNumber(a);
  const y = asNumber(b);
  if (x !== null && y !== null) return Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(x), Math.abs(y));
  return String(a) === String(b);
}

/** A sort key that keeps equal cells together: numbers by value (to 4 places), text by text, NULL first. */
function cellKey(c: Cell): string {
  if (c === null) return "0";
  const n = asNumber(c);
  if (n !== null) {
    // Fixed-width so text order is numeric order: sign bit, then the magnitude.
    const r = Math.round(n * 1e4) / 1e4;
    return `1${r < 0 ? "0" : "1"}${(r < 0 ? 1e15 + r : r).toFixed(4).padStart(22, "0")}`;
  }
  return `2${String(c)}`;
}

const rowKey = (row: Cell[]): string => row.map(cellKey).join("\u0001");

export const showCell = (c: Cell): string => (c === null ? "NULL" : typeof c === "string" ? `"${c}"` : String(c));
const showRow = (row: Cell[]): string => `(${row.map(showCell).join(", ")})`;

export function compareResults(expected: ResultSet, actual: ResultSet, ordered: boolean): Comparison {
  const ec = expected.columns.map((c) => c.trim().toLowerCase());
  const ac = actual.columns.map((c) => c.trim().toLowerCase());
  if (ec.length !== ac.length) {
    return { ok: false, reason: `Expected ${ec.length} column${ec.length === 1 ? "" : "s"} (${expected.columns.join(", ")}), got ${ac.length} (${actual.columns.join(", ")}).` };
  }
  const named = ec.findIndex((c, i) => c !== ac[i]);
  if (named !== -1) {
    return { ok: false, reason: `Column ${named + 1} should be named "${expected.columns[named]}", not "${actual.columns[named]}" — alias it with AS.` };
  }
  if (expected.totalRows !== actual.totalRows) {
    return { ok: false, reason: `Expected ${expected.totalRows} row${expected.totalRows === 1 ? "" : "s"}, got ${actual.totalRows}.` };
  }
  if (actual.truncated || expected.truncated) {
    // Both counted the same number of rows past what was kept; compare what was kept.
  }
  const e = ordered ? expected.rows : [...expected.rows].sort((a, b) => (rowKey(a) < rowKey(b) ? -1 : rowKey(a) > rowKey(b) ? 1 : 0));
  const a = ordered ? actual.rows : [...actual.rows].sort((x, y) => (rowKey(x) < rowKey(y) ? -1 : rowKey(x) > rowKey(y) ? 1 : 0));
  for (let i = 0; i < Math.min(e.length, a.length); i++) {
    const er = e[i]!;
    const ar = a[i]!;
    if (er.length !== ar.length || er.some((c, j) => !cellsEqual(c, ar[j]!))) {
      if (ordered) {
        // Same rows in another order is its own, kinder message.
        const sameSet = compareResults(expected, actual, false);
        if (sameSet.ok) return { ok: false, reason: "The rows are right but in the wrong order — check the ORDER BY the statement asks for." };
        return { ok: false, reason: `Row ${i + 1} should be ${showRow(er)}, got ${showRow(ar)}.` };
      }
      return { ok: false, reason: `Expected a row ${showRow(er)} that your result does not have (or has a different number of times).` };
    }
  }
  return { ok: true };
}
