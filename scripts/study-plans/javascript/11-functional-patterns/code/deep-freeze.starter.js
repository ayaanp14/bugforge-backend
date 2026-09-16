"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const state = JSON.parse(lines[0]);
function deepFreeze(value) {
  // TODO: freeze every nested object and array, return the value
}
deepFreeze(state);
const getPath = (obj, path) => path.split(".").reduce((o, k) => o[k], obj);
for (const line of lines.slice(1)) {
  const [cmd, path, ...rest] = line.trim().split(/\s+/);
  // TODO: set <path> <json> | push <path> <json> | frozen <path> — report changed / TypeError
}
