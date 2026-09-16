"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
const scores = tokens.slice(1, n + 1).map(Number);
const grade = (s) => (s >= 90 ? "A" : s >= 75 ? "B" : s >= 50 ? "C" : "F");
for (const s of scores) console.log(`${s} ${grade(s)}`);
const passed = scores.filter((s) => grade(s) !== "F").length;
console.log(`passed=${passed}`);
