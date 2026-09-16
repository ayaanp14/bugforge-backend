"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
let computations = 0;
const cache = new WeakMap();
function sumOfSquares(obj) {
  // TODO: cache by object identity; count real computations
}
const objects = new Map();
for (const line of lines) {
  const [cmd, a, ...rest] = line.trim().split(/\s+/);
  // TODO: obj <id> <numbers> | clone <id> <newId> | calc <id>
}
console.log(`computations=${computations}`);
