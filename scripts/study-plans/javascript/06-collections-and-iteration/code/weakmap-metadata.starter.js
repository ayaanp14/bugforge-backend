"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const registry = new Map();     // name -> object (strong: the program owns these)
const meta = new WeakMap();     // object -> tags (weak: goes away with the object)
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  // TODO: make <name> | tag <name> <tag> | untag <name> | info <name> | tagprim <value> <tag>
}
