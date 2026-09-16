"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function memoize(fn, key = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  const wrapped = (...args) => {
    const k = key(...args);
    if (cache.has(k)) { wrapped.hits++; return cache.get(k); }
    wrapped.misses++;
    const value = fn(...args);
    cache.set(k, value);
    return value;
  };
  wrapped.hits = 0; wrapped.misses = 0; wrapped.cache = cache;
  return wrapped;
}
const n = Number(lines[0]);
let naiveCalls = 0;
const fibNaive = (k) => { naiveCalls++; return k < 2 ? k : fibNaive(k - 1) + fibNaive(k - 2); };
let memoCalls = 0;
const fib = memoize((k) => { memoCalls++; return k < 2 ? k : fib(k - 1) + fib(k - 2); }, (k) => k);   // recurse through the memoized name
console.log(`fib(${n})=${fib(n)} naiveCalls=${(fibNaive(n), naiveCalls)} memoCalls=${memoCalls} hits=${fib.hits} misses=${fib.misses}`);
fib(n);
console.log(`secondCall: memoCalls=${memoCalls} hits=${fib.hits}`);
const slowKeys = memoize((a, b) => `${a}|${b}`);
slowKeys(1, 2); slowKeys(1, 2); slowKeys(2, 1);
console.log(`jsonKey: hits=${slowKeys.hits} misses=${slowKeys.misses} keys=${JSON.stringify([...slowKeys.cache.keys()])}`);
const byIdentity = new WeakMap();
let areaCalls = 0;
const area = (rect) => { if (!byIdentity.has(rect)) { areaCalls++; byIdentity.set(rect, rect.w * rect.h); } return byIdentity.get(rect); };
const r1 = { w: 2, h: 3 }, r2 = { w: 2, h: 3 };
console.log(`identity: ${area(r1)},${area(r1)},${area(r2)} areaCalls=${areaCalls} (equal contents, two objects)`);
