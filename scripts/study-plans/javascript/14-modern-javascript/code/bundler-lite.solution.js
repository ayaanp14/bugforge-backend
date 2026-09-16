"use strict";
const input = require("fs").readFileSync(0, "utf8");
// Modules are text blocks starting `// file: name.js`; statements: `import { a, b } from "./x.js";`, `export const a = ...;`, `export function f() { ... }` (one line each), other lines are kept as-is.
const [entryLine, ...rest] = input.split("\n");
const entry = entryLine.replace(/^entry:\s*/, "").trim();
const modules = new Map();
let current = null;
for (const line of rest) {
  const m = /^\/\/ file: (\S+)/.exec(line);
  if (m) { current = { name: m[1], lines: [], imports: new Map(), exports: [] }; modules.set(m[1], current); continue; }
  if (!current || line.trim() === "") continue;
  const im = /^import \{([^}]*)\} from "\.\/(.+?)";?$/.exec(line.trim());
  if (im) { current.imports.set(im[2], im[1].split(",").map((s) => s.trim()).filter(Boolean)); continue; }
  const ex = /^export (?:const|let|function|class) (\w+)/.exec(line.trim());
  if (ex) current.exports.push(ex[1]);
  current.lines.push(line);
}
const order = [], visiting = new Set(), used = new Map();
(function visit(name, from) {
  const mod = modules.get(name);
  if (!mod) throw new Error(`cannot resolve ./${name} from ${from}`);
  if (order.includes(name)) return;
  if (visiting.has(name)) { console.log(`warning: circular import ${from} -> ${name}`); return; }
  visiting.add(name);
  for (const [dep, names] of mod.imports) { (used.get(dep) ?? used.set(dep, new Set()).get(dep)); for (const n of names) used.get(dep).add(n); visit(dep, name); }
  visiting.delete(name);
  order.push(name);                                            // dependencies first: post-order
})(entry, "<root>");
const out = [], dropped = [];
for (const name of order) {
  const mod = modules.get(name);
  const wanted = name === entry ? new Set(mod.exports) : (used.get(name) ?? new Set());
  out.push(`// ---- ${name}`);
  for (const line of mod.lines) {
    const ex = /^export (?:const|let|function|class) (\w+)/.exec(line.trim());
    if (ex && !wanted.has(ex[1])) { dropped.push(`${name}:${ex[1]}`); continue; }    // tree-shaken
    out.push(line.replace(/^(\s*)export /, "$1"));
  }
}
console.log(out.join("\n"));
console.log(`// dropped: ${dropped.join(", ") || "-"} | order: ${order.join(" -> ")} | unused modules: ${[...modules.keys()].filter((m) => !order.includes(m)).join(", ") || "-"}`);
