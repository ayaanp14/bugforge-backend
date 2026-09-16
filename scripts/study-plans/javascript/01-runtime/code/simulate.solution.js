"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
const micro = [], tasks = [], order = [];
const emit = (label) => { console.log(label); order.push(label); };
for (let i = 1; i <= n; i++) {
  const [kind, label] = tokens[i].split(":");
  if (kind === "sync") emit(label);
  else if (kind === "micro") micro.push(label);
  else tasks.push(label);
}
micro.forEach(emit);
tasks.forEach(emit);
console.log(`order=${order.join(",")}`);
