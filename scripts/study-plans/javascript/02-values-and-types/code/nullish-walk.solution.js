"use strict";
const [objLine, pathLine, fallback] = require("fs").readFileSync(0, "utf8").split("\n");
const root = JSON.parse(objLine);
const keys = pathLine.trim().split(".");
let cur = root;
for (const k of keys) {
  cur = cur?.[k];               // optional chaining: undefined once anything along the way is nullish
}
console.log(`value=${cur === undefined ? "undefined" : JSON.stringify(cur)}`);
console.log(`withDefault=${JSON.stringify(cur ?? fallback.trim())}`);
console.log(`typeof=${typeof cur}`);
