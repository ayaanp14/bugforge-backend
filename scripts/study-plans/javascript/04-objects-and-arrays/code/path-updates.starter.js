"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const original = JSON.parse(lines[0]);
function setPath(obj, keys, value) {
  // TODO: return a NEW object with keys[0].keys[1]... set to value; share untouched subtrees
  return obj;
}
let current = original;
for (const line of lines.slice(1)) {
  const [, path, ...rest] = line.trim().split(/\s+/);
  current = setPath(current, path.split("."), JSON.parse(rest.join(" ")));
}
// TODO: print final, original, shared
