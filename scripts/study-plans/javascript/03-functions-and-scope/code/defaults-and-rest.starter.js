"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
function greet(name = "world", punctuation = "!") { return `Hello, ${name}${punctuation}`; }
function sum(...nums) { return nums.reduce((a, b) => a + b, 0); }
let pos = 0;
const next = () => tokens[pos++];
const n = Number(next());
for (let i = 0; i < n; i++) {
  const cmd = next();
  // TODO: greet <name|-> <punct|->  and  sum <k> <values>
}
