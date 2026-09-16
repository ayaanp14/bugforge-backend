"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const state = JSON.parse(lines[0]);
function deepFreeze(value) {
  if (value !== null && typeof value === "object") {
    for (const inner of Object.values(value)) deepFreeze(inner);   // children first, then the parent
    Object.freeze(value);
  }
  return value;
}
deepFreeze(state);
const getPath = (obj, path) => path.split(".").reduce((o, k) => o[k], obj);
for (const line of lines.slice(1)) {
  const [cmd, path, ...rest] = line.trim().split(/\s+/);
  try {
    if (cmd === "set") {
      const keys = path.split(".");
      const target = keys.length > 1 ? getPath(state, keys.slice(0, -1).join(".")) : state;
      target[keys.at(-1)] = JSON.parse(rest.join(" "));
      console.log(`${line.trim()}: changed`);
    } else if (cmd === "push") {
      getPath(state, path).push(JSON.parse(rest.join(" ")));
      console.log(`${line.trim()}: changed`);
    } else if (cmd === "frozen") console.log(`${line.trim()}: ${Object.isFrozen(getPath(state, path))}`);
  } catch (err) {
    console.log(`${line.trim()}: ${err.constructor.name}`);
  }
}
console.log(`state=${JSON.stringify(state)}`);
