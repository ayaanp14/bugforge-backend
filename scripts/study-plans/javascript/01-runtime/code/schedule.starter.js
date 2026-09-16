"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
for (let i = 1; i <= n; i++) {
  const [kind, label] = tokens[i].split(":");
  // TODO: log now, or schedule as a microtask or a timeout
}
