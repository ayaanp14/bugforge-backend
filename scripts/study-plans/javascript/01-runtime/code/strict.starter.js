"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);

function attempt(name) {
  // TODO: perform the mistake; return the error class name or "no error"
  return "no error";
}

for (let i = 1; i <= n; i++) console.log(`${tokens[i]}: ${attempt(tokens[i])}`);
