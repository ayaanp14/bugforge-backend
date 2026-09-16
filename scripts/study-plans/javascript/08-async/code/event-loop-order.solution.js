"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
for (const line of lines) {
  const [kind, label, ms] = line.trim().split(/\s+/);
  if (kind === "sync") console.log(label);
  else if (kind === "timeout") setTimeout(() => console.log(label), Number(ms));
  else if (kind === "micro") Promise.resolve().then(() => console.log(label));
  else if (kind === "tick") process.nextTick(() => console.log(label));
}
