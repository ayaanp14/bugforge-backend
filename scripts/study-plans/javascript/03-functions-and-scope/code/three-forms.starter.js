"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
// TODO: add (declaration), sub (expression), mul (arrow), stats(...nums)
const n = Number(tokens[0]);
// TODO
