"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
let computations = 0;
const cache = new WeakMap();
function sumOfSquares(obj) {
  if (cache.has(obj)) return { value: cache.get(obj), from: "cached" };
  computations++;
  const value = obj.values.reduce((s, x) => s + x * x, 0);
  cache.set(obj, value);
  return { value, from: "computed" };
}
const objects = new Map();
for (const line of lines) {
  const [cmd, a, ...rest] = line.trim().split(/\s+/);
  if (cmd === "obj") objects.set(a, { id: a, values: rest.map(Number) });
  else if (cmd === "clone") objects.set(rest[0], { ...objects.get(a), id: rest[0] });   // same values, new identity
  else if (cmd === "calc") {
    const r = sumOfSquares(objects.get(a));
    console.log(`${a}: ${r.value} (${r.from})`);
  }
}
console.log(`computations=${computations}`);
