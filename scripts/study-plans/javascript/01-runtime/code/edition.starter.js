"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const editions = new Map([
  ["let-const", 2015],
  // TODO: the rest of the table
]);
const n = Number(tokens[0]);
// TODO
