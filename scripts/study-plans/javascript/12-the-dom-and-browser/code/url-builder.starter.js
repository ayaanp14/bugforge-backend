"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
let url = null;
for (const line of lines) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  // TODO: base <url> | resolve <relative> | set <k> <v...> | append <k> <v> | delete <k> | path <segments...> | hash <h> | show | parts | params
}
