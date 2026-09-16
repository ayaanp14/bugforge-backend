"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
let pos = 0;
const next = () => tokens[pos++];
const n = Number(next());
const arr = [];
for (let i = 0; i < n; i++) {
  const cmd = next();
  // TODO: push x | pop | shift | unshift x | splice i del [items...] | show
}
