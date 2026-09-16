"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
const obj = {};
for (let i = 0; i < n; i++) {
  const key = tokens[1 + 2 * i], raw = tokens[2 + 2 * i];
  obj[key] = Number.isFinite(Number(raw)) ? Number(raw) : raw;   // computed key via brackets
}
console.log(`keys=${Object.keys(obj).join(",")}`);
console.log(`hasOwn(toString)=${Object.hasOwn(obj, "toString")} in(toString)=${"toString" in obj}`);
console.log(`json=${JSON.stringify(obj)}`);
console.log(`entries=${Object.entries(obj).map(([k, v]) => `${k}:${typeof v}`).join(" ")}`);
