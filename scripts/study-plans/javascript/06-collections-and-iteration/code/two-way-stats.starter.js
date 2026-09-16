"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function* stats() {
  // TODO: receive numbers through next(x); yield { count, sum, min, max, avg } after each
}
const gen = stats();
gen.next();   // prime: run to the first yield
for (const line of lines) {
  const [cmd, value] = line.trim().split(/\s+/);
  // TODO: add <x> | done
}
