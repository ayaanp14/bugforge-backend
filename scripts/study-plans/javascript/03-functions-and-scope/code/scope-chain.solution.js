"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const n = Number(lines[0]);
const parent = new Map(), vars = new Map();
for (let i = 1; i <= n; i++) {
  const [name, p, ...declared] = lines[i].trim().split(/\s+/);
  parent.set(name, p === "-" ? null : p);
  vars.set(name, new Set(declared));
}
const q = Number(lines[n + 1]);
for (let i = 0; i < q; i++) {
  const [scope, name] = lines[n + 2 + i].trim().split(/\s+/);
  let cur = scope, hops = 0, found = null;
  while (cur !== null) {
    if (vars.get(cur).has(name)) { found = cur; break; }
    cur = parent.get(cur);
    hops++;
  }
  console.log(found ? `${name} from ${scope}: found in ${found} (${hops} up)` : `${name} from ${scope}: ReferenceError`);
}
