"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
for (let i = 0; i < n; i++) {
  const a = Number(tokens[1 + 2 * i]), b = Number(tokens[2 + 2 * i]);
  const mod = ((a % b) + b) % b;
  console.log(`${a}/${b}: div=${a / b} floor=${Math.floor(a / b)} trunc=${Math.trunc(a / b)} rem=${a % b} mod=${mod}`);
}
