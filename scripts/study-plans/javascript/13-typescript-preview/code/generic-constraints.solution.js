"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Runtime stand-ins for generic signatures:  first<T>(xs: T[]): T | undefined   pluck<T, K extends keyof T>(items: T[], key: K): T[K][]   longest<T extends { length: number }>(a: T, b: T): T
const tsType = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);
function first(xs) { return xs[0]; }
function pluck(items, key) {
  if (!items.every((it) => it !== null && typeof it === "object" && key in it)) throw new TypeError(`Argument of type '"${key}"' is not assignable to parameter of type 'keyof T'`);
  return items.map((it) => it[key]);      // T[K][]: the element type follows the property
}
function longest(a, b) {
  for (const v of [a, b]) if (v === null || typeof v.length !== "number") throw new TypeError(`Argument of type '${tsType(v)}' is not assignable to parameter of type '{ length: number; }'`);
  return a.length >= b.length ? a : b;
}
const items = JSON.parse(lines[0]);
for (const line of lines.slice(1)) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  try {
    if (cmd === "first") { const v = first(items); console.log(`first -> ${JSON.stringify(v)} : ${v === undefined ? "undefined (T | undefined)" : "T"}`); }
    else if (cmd === "pluck") { const out = pluck(items, args[0]); console.log(`pluck ${args[0]} -> ${JSON.stringify(out)} : ${[...new Set(out.map(tsType))].join(" | ") || "never"}[]`); }
    else if (cmd === "longest") { const [a, b] = args.map((s) => JSON.parse(s)); console.log(`longest ${args.join(" ")} -> ${JSON.stringify(longest(a, b))}`); }
  } catch (err) {
    console.log(`${line.trim()} -> ${err.message}`);
  }
}
