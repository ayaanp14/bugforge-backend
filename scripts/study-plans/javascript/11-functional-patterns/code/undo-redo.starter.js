"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function setIn(obj, keys, value) {
  // TODO: immutable update along the path (module 4)
}
const history = [JSON.parse(lines[0])];
let cursor = 0;
for (const line of lines.slice(1)) {
  const [cmd, path, ...rest] = line.trim().split(/\s+/);
  // TODO: set <path> <json> (truncate redo history) | undo | redo | show
}
