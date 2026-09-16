"use strict";
const input = require("fs").readFileSync(0, "utf8");
const graph = JSON.parse(input);      // { entry, modules: { name: { exports: [...], imports: { dep: [names] }, sideEffects: bool } } }
const { entry, modules } = graph;
const reachable = new Set();
const used = new Map();                // module -> Set of imported names
(function visit(name) {
  if (reachable.has(name) || !modules[name]) return;
  reachable.add(name);
  for (const [dep, names] of Object.entries(modules[name].imports ?? {})) {
    if (!used.has(dep)) used.set(dep, new Set());
    for (const n of names) used.get(dep).add(n);
    visit(dep);
  }
})(entry);
const kept = [], droppedExports = [], droppedModules = [], sideEffectOnly = [];
for (const name of Object.keys(modules).sort()) {
  const mod = modules[name];
  if (!reachable.has(name)) { droppedModules.push(name); continue; }
  const wanted = name === entry ? new Set(mod.exports) : (used.get(name) ?? new Set());
  const keptExports = mod.exports.filter((e) => wanted.has(e));
  const unused = mod.exports.filter((e) => !wanted.has(e));
  if (keptExports.length === 0 && name !== entry) {
    if (mod.sideEffects) sideEffectOnly.push(name);          // nothing imported, but it runs code at import time: must stay
    else { droppedModules.push(name); continue; }
  }
  kept.push(`${name}[${keptExports.join(",") || "-"}]`);
  for (const e of unused) droppedExports.push(`${name}:${e}`);
}
console.log(`kept: ${kept.join(" ")}`);
console.log(`dropped exports: ${droppedExports.join(" ") || "-"}`);
console.log(`dropped modules: ${droppedModules.join(" ") || "-"}`);
console.log(`kept for side effects: ${sideEffectOnly.join(" ") || "-"}`);
