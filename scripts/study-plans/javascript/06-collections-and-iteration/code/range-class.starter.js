"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
let returnCalls = 0;
class Range {
  constructor(from, to, step = 1) { this.from = from; this.to = to; this.step = step; }
  [Symbol.iterator]() {
    // TODO: return an iterator object with next() and return() (count return() calls)
  }
}
const [from, to, step] = lines[0].trim().split(/\s+/).map(Number);
const breakAt = Number(lines[1]);
const r = new Range(from, to, step);
// TODO
