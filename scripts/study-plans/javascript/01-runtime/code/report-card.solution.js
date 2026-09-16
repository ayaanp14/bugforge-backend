"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
let pos = 0;
const next = () => tokens[pos++];
const n = Number(next());
const out = [];
let best = null, bestAvg = -Infinity;
for (let i = 0; i < n; i++) {
  const name = next();
  const scores = [Number(next()), Number(next()), Number(next())];
  const avg = (scores[0] + scores[1] + scores[2]) / 3;
  out.push(name.padEnd(8) + scores.map((s) => String(s).padStart(4)).join("") + avg.toFixed(1).padStart(6));
  if (avg > bestAvg) { bestAvg = avg; best = name; }
}
out.push(`best=${best}`);
console.log(out.join("\n"));
