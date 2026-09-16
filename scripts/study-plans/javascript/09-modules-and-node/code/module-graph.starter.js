"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const deps = new Map();       // name -> [deps]
let entry;
for (const line of lines) {
  const [cmd, name, ...rest] = line.trim().split(/\s+/);
  if (cmd === "module") deps.set(name.replace(/:$/, ""), rest);
  else if (cmd === "entry") entry = name;
}
// TODO: simulate CommonJS loading from the entry: start order, finish order, cycles (a require of a module still loading)
