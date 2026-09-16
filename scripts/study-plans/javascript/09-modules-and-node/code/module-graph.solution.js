"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const deps = new Map();       // name -> [deps]
let entry;
for (const line of lines) {
  const [cmd, name, ...rest] = line.trim().split(/\s+/);
  if (cmd === "module") deps.set(name.replace(/:$/, ""), rest);
  else if (cmd === "entry") entry = name;
}
const started = [], finished = [], cycles = [], missing = [];
const state = new Map();      // name -> "loading" | "loaded"
const stack = [];
function load(name) {
  if (state.get(name) === "loaded") return;                                    // require.cache hit
  if (state.get(name) === "loading") {                                         // a cycle: CJS hands back the partial exports
    cycles.push(`${stack.slice(stack.indexOf(name)).join(" -> ")} -> ${name}`);
    return;
  }
  if (!deps.has(name)) { missing.push(name); return; }
  state.set(name, "loading");
  stack.push(name);
  started.push(name);
  for (const d of deps.get(name)) load(d);                                      // each require runs the dependency to completion first
  stack.pop();
  state.set(name, "loaded");
  finished.push(name);
}
load(entry);
console.log(`start: ${started.join(" ")}`);
console.log(`finish: ${finished.join(" ")}`);
console.log(`cycles: ${cycles.length ? cycles.join("; ") : "none"}`);
console.log(`missing: ${missing.length ? [...new Set(missing)].join(",") : "none"} unused: ${[...deps.keys()].filter((m) => !state.has(m)).join(",") || "none"}`);
