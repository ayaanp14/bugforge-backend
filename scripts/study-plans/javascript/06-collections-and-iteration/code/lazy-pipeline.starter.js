"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
let pulled = 0;
function* naturals() { let n = 1; while (true) { pulled++; yield n++; } }
// TODO: take(n, it), map(fn, it), filter(pred, it), flatten(nested) using yield*
const [k, m] = lines[0].trim().split(/\s+/).map(Number);
const nested = JSON.parse(lines[1]);
// TODO
