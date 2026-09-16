"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const n = Number(lines[0]);
const parent = new Map(), vars = new Map();
for (let i = 1; i <= n; i++) {
  const [name, p, ...declared] = lines[i].trim().split(/\s+/);
  parent.set(name, p === "-" ? null : p);
  vars.set(name, new Set(declared));
}
// TODO: resolve each query by walking parents
