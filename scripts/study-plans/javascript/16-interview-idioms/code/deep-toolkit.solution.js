"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const evaluate = (src) => new Function(`return (${src});`)();   // the inputs are trusted JavaScript expressions
// Commands (TAP output): equal <true|false> ||| <a> ||| <b>   |   clone <expr>   |   flatten <expr>
function deepEqual(a, b, seen = new Map()) {
  if (Object.is(a, b)) return true;                                            // NaN equals NaN; 0 and -0 differ
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (seen.get(a) === b) return true;                                          // a pair already being compared: assume equal (cycles)
  seen.set(a, b);
  if (a instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp) return a.source === b.source && a.flags === b.flags;
  if (a instanceof Map) { if (a.size !== b.size) return false; for (const [k, v] of a) if (!b.has(k) || !deepEqual(v, b.get(k), seen)) return false; return true; }
  if (a instanceof Set) { if (a.size !== b.size) return false; for (const v of a) if (!b.has(v)) return false; return true; }
  if (Array.isArray(a)) { if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i], seen)) return false; return true; }
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k], seen));
}
function deepClone(value, seen = new WeakMap()) {
  if (typeof value !== "object" || value === null) return value;
  if (seen.has(value)) return seen.get(value);                                 // cycles and shared references map to one clone
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (value instanceof Map) { const out = new Map(); seen.set(value, out); for (const [k, v] of value) out.set(deepClone(k, seen), deepClone(v, seen)); return out; }
  if (value instanceof Set) { const out = new Set(); seen.set(value, out); for (const v of value) out.add(deepClone(v, seen)); return out; }
  if (Array.isArray(value)) { const out = []; seen.set(value, out); value.forEach((v, i) => { out[i] = deepClone(v, seen); }); return out; }
  const out = Object.create(Object.getPrototypeOf(value));                     // keep the prototype: class instances stay instances
  seen.set(value, out);
  for (const k of Object.keys(value)) out[k] = deepClone(value[k], seen);
  return out;
}
function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length) flatten(v, key, out); else out[key] = v;
  }
  return out;
}
function unflatten(flat) {
  const out = {};
  for (const [path, v] of Object.entries(flat)) { const parts = path.split("."); let cur = out; for (const p of parts.slice(0, -1)) cur = cur[p] ??= {}; cur[parts.at(-1)] = v; }
  return out;
}
let n = 0, pass = 0;
const tap = (ok, text) => { n++; if (ok) pass++; console.log(`${ok ? "ok" : "not ok"} ${n} - ${text}`); };
for (const line of lines) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  const body = rest.join(" ");
  if (cmd === "equal") {
    const [expected, a, b] = body.split("|||").map((p) => p.trim());
    const got = deepEqual(evaluate(a), evaluate(b));
    tap(String(got) === expected, `equal ${a} vs ${b} -> ${got}`);
  } else if (cmd === "clone") {
    const original = evaluate(body), copy = deepClone(original);
    const distinct = copy !== original, equal = deepEqual(copy, original);
    const cycle = original && original.self === original ? (copy.self === copy ? "kept" : "BROKEN") : "n/a";
    const shared = original && original.x !== undefined && original.x === original.y ? (copy.x === copy.y && copy.x !== original.x ? "kept" : "BROKEN") : "n/a";
    const types = Object.keys(original ?? {}).every((k) => Object.getPrototypeOf(copy[k] ?? 0) === Object.getPrototypeOf(original[k] ?? 0));
    tap(distinct && equal && cycle !== "BROKEN" && shared !== "BROKEN" && types, `clone: equal=${equal} distinct=${distinct} cycle=${cycle} shared=${shared} typesKept=${types}`);
  } else if (cmd === "flatten") {
    const value = evaluate(body), flat = flatten(value);
    tap(deepEqual(unflatten(flat), value), `flatten ${JSON.stringify(flat)} roundtrip=${deepEqual(unflatten(flat), value)}`);
  }
}
console.log(`1..${n}`);
console.log(`# pass ${pass} fail ${n - pass}`);
