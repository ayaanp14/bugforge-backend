"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [header, ...frameLines] = input.split("\n").filter((l) => l.trim() !== "");
// TODO: parse `    at fn (file:line:col)` and `    at file:line:col`
