"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function memoize(fn, key = (...args) => JSON.stringify(args)) {
  // TODO: Map cache, hits/misses counters on the wrapper
}
const n = Number(lines[0]);
// TODO: naive fib call count vs memoized fib call count; a memoized function over objects keyed by identity (WeakMap)
