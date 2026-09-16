"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
function greet(name = "world", punctuation = "!") { return `Hello, ${name}${punctuation}`; }
function sum(...nums) { return nums.reduce((a, b) => a + b, 0); }
let pos = 0;
const next = () => tokens[pos++];
const arg = (t) => (t === "-" ? undefined : t === "null" ? null : t);
const n = Number(next());
for (let i = 0; i < n; i++) {
  const cmd = next();
  if (cmd === "greet") {
    console.log(greet(arg(next()), arg(next())));
  } else {
    const k = Number(next());
    const values = [];
    for (let j = 0; j < k; j++) values.push(Number(next()));
    console.log(`sum=${sum(...values)}`);
  }
}
