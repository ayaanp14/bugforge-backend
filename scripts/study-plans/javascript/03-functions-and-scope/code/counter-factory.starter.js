"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
function makeCounter(start = 0) {
  // TODO: private count; return { inc, dec, get }
}
let pos = 0;
const next = () => tokens[pos++];
const n = Number(next());
const counters = new Map();
for (let i = 0; i < n; i++) {
  const cmd = next(), name = next();
  // TODO
}
console.log(`counters=${counters.size}`);
