"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
function memoize(f) {
  // TODO: cache in a closure; also count hits and misses on the returned function (fn.hits, fn.misses)
}
const collatzSteps = (x) => { let s = 0; while (x !== 1) { x = x % 2 === 0 ? x / 2 : 3 * x + 1; s++; } return s; };
const steps = memoize(collatzSteps);
const n = Number(tokens[0]);
// TODO
