"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
main();

function main() {
  // TODO: call square (declared below) — fine; try cube (a const arrow below) — ReferenceError; report typeof v before var v
}

function square(x) { return x * x; }
const cube = (x) => x * x * x;
