"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const a = new Set(lines[0].trim().split(/\s+/).map(Number));
const b = new Set(lines[1].trim().split(/\s+/).map(Number));
const show = (s) => JSON.stringify([...s].sort((x, y) => Number.isNaN(x) - Number.isNaN(y) || x - y).map((x) => (Number.isNaN(x) ? "NaN" : x)));
// TODO: union, intersection, a-b, symmetric difference, isSubset(a, b)
