"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
// Turn a token into the value it names: null, undefined, NaN, booleans, numbers, bigints, empty (the
// empty string), [] and {} as JSON, anything else as a plain string.
function parse(t) {
  if (t === "null") return null;
  if (t === "undefined") return undefined;
  if (t === "NaN") return NaN;
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "empty") return "";
  if (/^-?\d+n$/.test(t)) return BigInt(t.slice(0, -1));
  if (t.startsWith("[") || t.startsWith("{")) { try { return JSON.parse(t); } catch { return t; } }
  if (t.trim() !== "" && Number.isFinite(Number(t))) return Number(t);
  return t;
}
const show = (v) => (typeof v === "string" ? JSON.stringify(v) : Array.isArray(v) ? JSON.stringify(v) : String(v));
const n = Number(tokens[0]);
for (let i = 0; i < n; i++) {
  const ta = tokens[1 + 2 * i], tb = tokens[2 + 2 * i];
  const a = parse(ta), b = parse(tb);
  const sum = a + b;
  // eslint-disable-next-line eqeqeq
  console.log(`${ta} ${tb} | ==:${a == b} ===:${a === b} +:${show(sum)} (${typeof sum})`);
}
