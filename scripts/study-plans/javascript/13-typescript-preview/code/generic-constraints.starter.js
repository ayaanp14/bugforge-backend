"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Runtime stand-ins for generic signatures:  first<T>(xs: T[]): T | undefined   pluck<T, K extends keyof T>(items: T[], key: K): T[K][]   longest<T extends { length: number }>(a: T, b: T): T
const tsType = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);
function first(xs) { return xs[0]; }
function pluck(items, key) {
  // TODO: every item must have the key, else throw TypeError(`Argument of type '"<key>"' is not assignable to parameter of type 'keyof T'`)
}
function longest(a, b) {
  // TODO: both must have a numeric length, else throw TypeError(`Argument of type '<type>' is not assignable to parameter of type '{ length: number; }'`)
}
const items = JSON.parse(lines[0]);
for (const line of lines.slice(1)) {
  // TODO: first | pluck <key> | longest <json> <json>
}
