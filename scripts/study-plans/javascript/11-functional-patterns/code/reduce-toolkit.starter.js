"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// TODO: map, filter, flatMap, groupBy, partition, zip, unique, countBy — each using reduce only
const nums = lines[0].trim().split(/\s+/).map(Number);
