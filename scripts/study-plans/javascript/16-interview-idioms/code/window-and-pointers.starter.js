"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// longest-unique <s> | at-most-k <k> <s> | max-window <k> <nums…> | pair-sorted <target> <sorted nums…>
for (const line of lines) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  // TODO
}
