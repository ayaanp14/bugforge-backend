"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const pipe = (...fns) => (x) => fns.reduce((acc, f) => f(acc), x);
const compose = (...fns) => (x) => fns.reduceRight((acc, f) => f(acc), x);
function curry(fn) {
  // TODO: auto-curry by fn.length
}
const partial = (fn, ...preset) => (...later) => fn(...preset, ...later);
// TODO
