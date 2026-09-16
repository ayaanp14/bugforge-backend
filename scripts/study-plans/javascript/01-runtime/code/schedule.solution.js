"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
for (let i = 1; i <= n; i++) {
  const [kind, label] = tokens[i].split(":");
  if (kind === "sync") console.log(label);
  else if (kind === "micro") Promise.resolve().then(() => console.log(label));
  else setTimeout(() => console.log(label), 0);
}
