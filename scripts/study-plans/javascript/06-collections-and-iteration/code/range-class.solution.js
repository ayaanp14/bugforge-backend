"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
let returnCalls = 0;
class Range {
  constructor(from, to, step = 1) { this.from = from; this.to = to; this.step = step; }
  [Symbol.iterator]() {
    let current = this.from;
    const { to, step } = this;
    return {
      next: () => (current <= to ? { value: (current += step) - step, done: false } : { value: undefined, done: true }),
      return: () => { returnCalls++; return { value: undefined, done: true }; },
    };
  }
}
const [from, to, step] = lines[0].trim().split(/\s+/).map(Number);
const breakAt = Number(lines[1]);
const r = new Range(from, to, step);
console.log(`spread=${JSON.stringify([...r])}`);
let sum = 0;
for (const x of r) sum += x;
console.log(`sum=${sum} again=${JSON.stringify([...r])}`);
const [first, second] = r;
console.log(`first=${first} second=${second} squares=${JSON.stringify(Array.from(r, (x) => x * x))}`);
const before = returnCalls;
for (const x of r) if (x === breakAt) break;
console.log(`breakAt=${breakAt} returnCalled=${returnCalls - before}`);
