"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
const obj = {};
// TODO: fill obj from n key/value pairs (numeric values as numbers), then report
