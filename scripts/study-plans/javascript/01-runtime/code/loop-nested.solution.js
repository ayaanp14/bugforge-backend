"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
const order = [];
const emit = (label) => { console.log(label); order.push(label); };
const micro = [], tasks = [];
const parse = (t) => t.split(":");

function schedule(kind, label, then) {
  if (kind === "sync") run({ label, then });
  else if (kind === "micro") micro.push({ label, then });
  else tasks.push({ label, then });
}
function run(item) {
  emit(item.label);
  if (item.then) schedule(item.then[0], item.then[1], null);
}
function drainMicro() {
  while (micro.length) run(micro.shift());
}

for (let i = 1; i <= n; i++) {
  const [head, tail] = tokens[i].split(">");
  const [kind, label] = parse(head);
  schedule(kind, label, tail ? parse(tail) : null);
}
drainMicro();
while (tasks.length) {
  run(tasks.shift());
  drainMicro();
}
console.log(`order=${order.join(",")}`);
