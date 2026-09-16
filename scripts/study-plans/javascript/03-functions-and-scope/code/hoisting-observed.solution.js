"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
main();

function main() {
  console.log(`declaration: square(${n})=${square(n)}`);
  try {
    console.log(`expression: cube(${n})=${cube(n)}`);
  } catch (e) {
    console.log(`expression: ${e.constructor.name}`);
  }
  console.log(`var before assignment: ${typeof v}`);
  var v = n;
  console.log(`var after assignment: ${typeof v}`);
}

function square(x) { return x * x; }
const cube = (x) => x * x * x;
