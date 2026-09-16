"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
function makeCounter() {
  // TODO: private value and history; inc, dec, undo, get, log
}
let pos = 0;
const next = () => tokens[pos++];
const n = Number(next());
const c = makeCounter();
for (let i = 0; i < n; i++) {
  const cmd = next();
  // TODO
}
