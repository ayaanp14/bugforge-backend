"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const stepNames = lines[0].trim().split(/\s+/);
const values = lines[1].trim().split(/\s+/).map(Number);
let tapped = 0;
const registry = {
  inc: () => (x) => x + 1,
  double: () => (x) => x * 2,
  add: (k) => (x) => x + Number(k),
  mul: (k) => (x) => x * Number(k),
  tap: () => (x) => { tapped++; return x; },
};
const pipe = (...fns) => (x) => fns.reduce((acc, f) => f(acc), x);
// TODO: build each step from name[:arg], pipe them, apply to every value, then print tapped
