"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class DataCloneError extends Error { constructor(msg) { super(msg); this.name = "DataCloneError"; } }
function structuredClonePolyfill(value, seen = new Map()) {
  if (value === null || typeof value !== "object") {
    if (typeof value === "function" || typeof value === "symbol") throw new DataCloneError(`${typeof value === "function" ? value.name || "function" : String(value)} could not be cloned.`);
    return value;
  }
  if (seen.has(value)) return seen.get(value);                 // a cycle or a shared reference: reuse the clone
  let out;
  if (value instanceof Date) out = new Date(value.getTime());
  else if (value instanceof RegExp) out = new RegExp(value.source, value.flags);
  else if (value instanceof Map) { out = new Map(); seen.set(value, out); for (const [k, v] of value) out.set(structuredClonePolyfill(k, seen), structuredClonePolyfill(v, seen)); return out; }
  else if (value instanceof Set) { out = new Set(); seen.set(value, out); for (const v of value) out.add(structuredClonePolyfill(v, seen)); return out; }
  else if (Array.isArray(value)) { out = []; seen.set(value, out); for (const v of value) out.push(structuredClonePolyfill(v, seen)); return out; }
  else {
    out = {};                                                     // class instances lose their prototype, like the real algorithm
    seen.set(value, out);
    for (const k of Object.keys(value)) out[k] = structuredClonePolyfill(value[k], seen);
    return out;
  }
  seen.set(value, out);
  return out;
}
const data = JSON.parse(lines[0]);
class Point { constructor(x) { this.x = x; } dist() { return this.x; } }
const original = { data, when: new Date(0), re: /a+/gi, map: new Map([["k", { n: 1 }]]), set: new Set([1, 2]), point: new Point(3) };
original.self = original;                                        // a cycle
original.twice = [original.data, original.data];                // a shared reference
const clone = structuredClonePolyfill(original);
console.log(`distinct=${clone !== original} dataEqual=${JSON.stringify(clone.data) === JSON.stringify(data)} dataDistinct=${clone.data !== original.data}`);
console.log(`cycle=${clone.self === clone} sharedRefPreserved=${clone.twice[0] === clone.twice[1] && clone.twice[0] === clone.data}`);
console.log(`date=${clone.when instanceof Date && clone.when.getTime() === 0} regex=${clone.re instanceof RegExp && clone.re.flags === "gi" && clone.re !== original.re}`);
console.log(`map=${clone.map instanceof Map && clone.map.get("k").n === 1 && clone.map.get("k") !== original.map.get("k")} set=${clone.set instanceof Set && clone.set.has(2)}`);
console.log(`pointIsPlain=${Object.getPrototypeOf(clone.point) === Object.prototype} x=${clone.point.x} distMethod=${typeof clone.point.dist}`);
for (const [label, bad] of [["function", { f: () => 1 }], ["symbol", { s: Symbol("x") }]]) {
  try { structuredClonePolyfill(bad); console.log(`${label}: cloned?!`); }
  catch (err) { console.log(`${label}: ${err.name}`); }
}
