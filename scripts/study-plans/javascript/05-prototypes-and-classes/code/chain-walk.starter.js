"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const objects = new Map();   // name -> object
const nameOf = new Map();    // object -> name
for (const line of lines) {
  const [cmd, name, ...rest] = line.trim().split(/\s+/);
  // TODO: def <name> <parent|-> [key value]... | get <name> <key> | set <name> <key> <value> | chain <name>
}
