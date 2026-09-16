"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
function add(a, b) { return a + b; }
const sub = function (a, b) { return a - b; };
const mul = (a, b) => a * b;
function stats(...nums) { return { count: nums.length, total: nums.reduce((s, x) => s + x, 0) }; }

const n = Number(tokens[0]);
const all = [];
for (let i = 0; i < n; i++) {
  const a = Number(tokens[1 + 2 * i]), b = Number(tokens[2 + 2 * i]);
  all.push(a, b);
  console.log(`${a} ${b}: add=${add(a, b)} sub=${sub(a, b)} mul=${mul(a, b)}`);
}
const s = stats(...all);
console.log(`names=${add.name},${sub.name},${mul.name} lengths=${add.length},${sub.length},${mul.length},${stats.length}`);
console.log(`stats: count=${s.count} total=${s.total}`);
