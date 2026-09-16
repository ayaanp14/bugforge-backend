"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);

function scenario(name) {
  // TODO: run the scenario and return what happened
  return "?";
}

for (let i = 1; i <= n; i++) console.log(`${tokens[i]}: ${scenario(tokens[i])}`);
