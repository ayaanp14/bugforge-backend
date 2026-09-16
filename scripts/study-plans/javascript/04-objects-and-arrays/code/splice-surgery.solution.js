"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
let pos = 0;
const next = () => tokens[pos++];
const n = Number(next());
const arr = [];
for (let i = 0; i < n; i++) {
  const cmd = next();
  if (cmd === "push") arr.push(Number(next()));
  else if (cmd === "pop") console.log(`popped=${arr.pop()}`);
  else if (cmd === "shift") console.log(`shifted=${arr.shift()}`);
  else if (cmd === "unshift") arr.unshift(Number(next()));
  else if (cmd === "splice") {
    const at = Number(next()), del = Number(next()), k = Number(next());
    const items = [];
    for (let j = 0; j < k; j++) items.push(Number(next()));
    console.log(`removed=${JSON.stringify(arr.splice(at, del, ...items))}`);
  } else console.log(`${JSON.stringify(arr)} length=${arr.length}`);
}
