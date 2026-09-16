"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
const withVar = [], withLet = [];
for (var i = 0; i < n; i++) withVar.push(() => i);      // one shared binding
for (let j = 0; j < n; j++) withLet.push(() => j);      // a fresh binding per iteration
console.log(`var: ${withVar.map((f) => f()).join(" ")}`);
console.log(`let: ${withLet.map((f) => f()).join(" ")}`);
