"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Each line: `<name>: <property> <property> ...` — the order properties are added; `-prop` deletes it (dictionary mode).
// A `site <name> <obj> <obj> ...` line is a property-access site that has seen those objects.
const transitions = new Map();     // "S0|x" -> shape id
let nextShape = 1;
const shapeProps = new Map([["S0", []]]);
const shapes = new Map();          // object name -> shape id
const sites = [];
for (const line of lines) {
  if (line.startsWith("site ")) { const [, name, ...objs] = line.trim().split(/\s+/); sites.push({ name, objs }); continue; }
  const [name, rest] = line.split(":");
  let shape = "S0";
  for (const step of (rest ?? "").trim().split(/\s+/).filter(Boolean)) {
    if (step.startsWith("-")) { shape = `DICT(${name.trim()})`; shapeProps.set(shape, ["<dictionary>"]); break; }   // delete: no more shared shape
    const key = `${shape}|${step}`;
    if (!transitions.has(key)) { transitions.set(key, `S${nextShape++}`); shapeProps.set(transitions.get(key), [...shapeProps.get(shape), step]); }
    shape = transitions.get(key);                          // the same property added to the same shape reaches the same next shape
  }
  shapes.set(name.trim(), shape);
}
for (const [name, shape] of shapes) console.log(`${name}: ${shape} (${shapeProps.get(shape).join(",") || "empty"})`);
console.log(`distinct shapes=${new Set(shapes.values()).size} transitions=${transitions.size}`);
for (const site of sites) {
  const seen = new Set(site.objs.map((o) => shapes.get(o)));
  const state = seen.size === 1 ? "monomorphic" : seen.size <= 4 ? "polymorphic" : "megamorphic";
  console.log(`site ${site.name}: ${state} (${seen.size} shape${seen.size === 1 ? "" : "s"})`);
}
