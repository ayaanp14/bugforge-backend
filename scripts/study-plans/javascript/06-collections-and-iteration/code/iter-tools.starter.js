"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// TODO: chunk(it, size), zip(...its), enumerate(it, start = 0), takeWhile(pred, it) — all generators
const a = lines[0].trim().split(/\s+/).map(Number);
const b = lines[1].trim().split(/\s+/);
const size = Number(lines[2]);
const limit = Number(lines[3]);
// TODO
