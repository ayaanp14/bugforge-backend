"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
function makeCounter(start = 0) {
  let count = start;
  return {
    inc: () => ++count,
    dec: () => --count,
    get: () => count,
  };
}
let pos = 0;
const next = () => tokens[pos++];
const n = Number(next());
const counters = new Map();
for (let i = 0; i < n; i++) {
  const cmd = next(), name = next();
  if (cmd === "new") counters.set(name, makeCounter(Number(next())));
  else if (cmd === "inc") counters.get(name).inc();
  else if (cmd === "dec") counters.get(name).dec();
  else console.log(`${name}=${counters.get(name).get()}`);
}
console.log(`counters=${counters.size}`);
