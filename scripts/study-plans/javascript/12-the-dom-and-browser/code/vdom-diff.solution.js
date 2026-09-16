"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const [oldTree, newTree] = lines.map((l) => JSON.parse(l));
function diff(a, b, path, patches) {
  if (typeof a === "string" || typeof b === "string") {
    if (typeof a !== typeof b) patches.push(`REPLACE ${path}`);
    else if (a !== b) patches.push(`TEXT ${path} ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
    return;
  }
  if (a.tag !== b.tag) { patches.push(`REPLACE ${path} <${a.tag}> -> <${b.tag}>`); return; }   // a different element: rebuild the subtree
  const ap = a.props ?? {}, bp = b.props ?? {};
  const changes = [];
  for (const k of Object.keys(bp)) { if (!(k in ap)) changes.push(`+${k}=${JSON.stringify(bp[k])}`); else if (ap[k] !== bp[k]) changes.push(`~${k}=${JSON.stringify(bp[k])}`); }
  for (const k of Object.keys(ap)) if (!(k in bp)) changes.push(`-${k}`);
  if (changes.length) patches.push(`PROPS ${path} ${changes.join(" ")}`);
  const ac = a.children ?? [], bc = b.children ?? [];
  const n = Math.max(ac.length, bc.length);
  for (let i = 0; i < n; i++) {
    const childPath = `${path}/${i}`;
    if (i >= ac.length) patches.push(`INSERT ${childPath} ${typeof bc[i] === "string" ? JSON.stringify(bc[i]) : `<${bc[i].tag}>`}`);
    else if (i >= bc.length) patches.push(`REMOVE ${childPath}`);
    else diff(ac[i], bc[i], childPath, patches);
  }
}
const patches = [];
diff(oldTree, newTree, "root", patches);
console.log(patches.length ? patches.join("\n") : "no changes");
