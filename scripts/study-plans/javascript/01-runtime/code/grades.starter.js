"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
const scores = tokens.slice(1, n + 1).map(Number);
const grade = (s) => "F"; // TODO: a conditional-operator chain
// TODO
