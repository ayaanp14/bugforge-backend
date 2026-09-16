"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const counts = new Map();
const dict = {};
for (const w of tokens) {
  counts.set(w, (counts.get(w) ?? 0) + 1);
  dict[w] = (dict[w] ?? 0) + 1;      // the object version: __proto__ never becomes a key
}
const top = [...counts].sort(([wa, a], [wb, b]) => b - a || wa.localeCompare(wb)).slice(0, 3);
console.log(`top=${top.map(([w, n]) => `${w}=${n}`).join(" ")}`);
console.log(`unique=${counts.size} total=${tokens.length}`);
console.log(`objectKeys=${Object.keys(dict).length} mapHasProto=${counts.has("__proto__")} objectHasOwnProto=${Object.hasOwn(dict, "__proto__")}`);
