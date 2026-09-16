"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const nums = lines[0].trim().split(/\s+/).map(Number);
const target = Number(lines[1]);
// TODO: brute force (count pairs checked), sort + two pointers (count steps), hash map (count lookups); print each with its complexity
