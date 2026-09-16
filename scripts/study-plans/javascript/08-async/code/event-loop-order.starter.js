"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
for (const line of lines) {
  const [kind, label, ms] = line.trim().split(/\s+/);
  // TODO: sync | timeout <label> <ms> | micro <label> | tick <label> — each prints its label when it runs
}
