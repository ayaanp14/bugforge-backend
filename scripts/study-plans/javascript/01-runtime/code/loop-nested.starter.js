"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
const order = [];
const emit = (label) => { console.log(label); order.push(label); };
const micro = [], tasks = [];
const parse = (t) => t.split(":");                 // ["kind", "label"]
// each queue item: { label, then } where then is [kind, label] or null
// TODO
console.log(`order=${order.join(",")}`);
