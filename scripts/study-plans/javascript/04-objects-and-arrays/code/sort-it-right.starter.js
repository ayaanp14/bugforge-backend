"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const nums = tokens.slice(1, Number(tokens[0]) + 1).map(Number);
// TODO: default (string) sort, numeric ascending, numeric descending — each on a copy
