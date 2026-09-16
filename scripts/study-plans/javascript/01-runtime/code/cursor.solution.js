"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
let pos = 0;
const next = () => tokens[pos++];
const nextInt = () => Number(next());

const n = nextInt();
if (n === 0) {
  console.log("empty");
} else {
  let sum = 0, min = Infinity, max = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = nextInt();
    sum += x;
    min = Math.min(min, x);
    max = Math.max(max, x);
  }
  console.log(`sum=${sum} min=${min} max=${max}`);
}
