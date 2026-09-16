"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
let pos = 0;
const next = () => tokens[pos++];
const n = Number(next());
const out = [];
let total = 0;
for (let i = 0; i < n; i++) {
  const name = next();
  const score = Number(next());
  total += score;
  out.push(name.padEnd(10) + score.toFixed(2).padStart(8));
}
out.push("-".repeat(18));
out.push("TOTAL".padEnd(10) + total.toFixed(2).padStart(8));
console.log(out.join("\n"));
