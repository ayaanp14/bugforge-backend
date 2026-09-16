"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function define(name, fn) {
  if (!Array.prototype[name]) Object.defineProperty(Array.prototype, name, { value: fn, writable: true, configurable: true, enumerable: false });
}
// TODO: toSorted, toReversed, with, toSpliced, findLast, findLastIndex — guarded, spec-shaped, non-enumerable
const arr = JSON.parse(lines[0]);
