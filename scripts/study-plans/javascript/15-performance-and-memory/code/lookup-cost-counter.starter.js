"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const ids = lines[0].trim().split(/\s+/);
const queries = lines[1].trim().split(/\s+/);
// TODO: count element comparisons for includes-style scans vs Set lookups; then element moves for a shift() queue vs an index pointer over the ids
