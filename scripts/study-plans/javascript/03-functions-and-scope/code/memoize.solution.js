"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
function memoize(f) {
  const cache = new Map();
  const wrapped = (x) => {
    if (cache.has(x)) { wrapped.hits++; return cache.get(x); }
    wrapped.misses++;
    const value = f(x);
    cache.set(x, value);
    return value;
  };
  wrapped.hits = 0;
  wrapped.misses = 0;
  return wrapped;
}
const collatzSteps = (x) => { let s = 0; while (x !== 1) { x = x % 2 === 0 ? x / 2 : 3 * x + 1; s++; } return s; };
const steps = memoize(collatzSteps);
const n = Number(tokens[0]);
for (let i = 1; i <= n; i++) {
  const x = Number(tokens[i]);
  console.log(`steps(${x})=${steps(x)}`);
}
console.log(`computed=${steps.misses} cached=${steps.hits}`);
