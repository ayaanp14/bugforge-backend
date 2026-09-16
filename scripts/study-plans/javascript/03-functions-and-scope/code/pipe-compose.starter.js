"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const steps = { inc: (x) => x + 1, double: (x) => x * 2, square: (x) => x * x, neg: (x) => -x };
const pipe = (...fns) => (x) => x;      // TODO
const compose = (...fns) => (x) => x;   // TODO
let pos = 0;
const next = () => tokens[pos++];
const k = Number(next());
const names = [];
for (let i = 0; i < k; i++) names.push(next());
const fns = names.map((s) => steps[s]);
const m = Number(next());
for (let i = 0; i < m; i++) {
  const x = Number(next());
  // TODO
}
