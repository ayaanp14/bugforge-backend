"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const root = { id: "S0", props: [], children: new Map() };
let counter = 1;
const all = [root];
function transition(shape, prop) {
  if (!shape.children.has(prop)) { const next = { id: `S${counter++}`, props: [...shape.props, prop], children: new Map(), parent: shape }; shape.children.set(prop, next); all.push(next); }
  return shape.children.get(prop);
}
const classes = new Map(), objects = new Map(), sites = [];
for (const line of lines) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (cmd === "class") classes.set(rest[0].replace(/:$/, ""), rest.slice(1));
  else if (cmd === "new") { let s = root; for (const p of classes.get(rest[0])) s = transition(s, p); objects.set(rest[1], { shape: s, dictionary: false, cls: rest[0] }); }
  else if (cmd === "set") { const o = objects.get(rest[0]); if (!o.dictionary) o.shape = transition(o.shape, rest[1]); }
  else if (cmd === "delete") { const o = objects.get(rest[0]); o.dictionary = true; }
  else if (cmd === "site") sites.push({ name: rest[0], objs: rest.slice(1) });
}
function printTree(shape, depth) {
  console.log(`${"  ".repeat(depth)}${shape.id}${shape.props.length ? ` {${shape.props.join(",")}}` : " {}"}`);
  for (const child of shape.children.values()) printTree(child, depth + 1);
}
console.log("transition tree:");
printTree(root, 1);
const shapeOf = (o) => (o.dictionary ? "dictionary" : o.shape.id);
console.log(`objects: ${[...objects].map(([n, o]) => `${n}=${shapeOf(o)}`).join(" ")}`);
for (const site of sites) {
  const seen = [...new Set(site.objs.map((n) => shapeOf(objects.get(n))))];
  const state = seen.includes("dictionary") ? "megamorphic (dictionary-mode object)" : seen.length === 1 ? "monomorphic" : seen.length <= 4 ? "polymorphic" : "megamorphic";
  console.log(`site ${site.name}: ${state} [${seen.join(",")}]`);
}
console.log(`shapes created=${all.length - 1} uniformClasses=${[...classes.keys()].filter((c) => [...objects.values()].filter((o) => o.cls === c && !o.dictionary).every((o, _, arr) => o.shape === arr[0].shape)).join(",") || "-"}`);
