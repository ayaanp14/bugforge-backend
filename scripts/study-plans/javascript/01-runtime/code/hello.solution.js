"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
for (let i = 1; i <= n; i++) {
  console.log(`Hello, ${tokens[i]}!`);
}
console.log(`Greeted ${n} ${n === 1 ? "person" : "people"}`);
