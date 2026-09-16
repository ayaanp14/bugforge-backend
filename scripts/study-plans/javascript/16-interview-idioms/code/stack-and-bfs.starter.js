"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// brackets <s> | next-greater <nums…> | simplify-path <path> | bfs <rows> followed by <rows> grid lines (S start, E end, # wall, . open)
for (let i = 0; i < lines.length; i++) {
  const [cmd, ...rest] = lines[i].trim().split(/\s+/);
  // TODO
}
