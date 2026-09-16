"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const adjacency = new Map();   // node -> Set of neighbours
function neighbours(n) {
  if (!adjacency.has(n)) adjacency.set(n, new Set());
  return adjacency.get(n);
}
function link(a, b) { neighbours(a).add(b); neighbours(b).add(a); }
function* bfs(start) {
  const seen = new Set([start]);
  const queue = [[start, 0, null]];
  while (queue.length) {
    const [node, dist, parent] = queue.shift();
    yield [node, dist, parent];
    for (const next of [...neighbours(node)].sort()) {
      if (!seen.has(next)) { seen.add(next); queue.push([next, dist + 1, node]); }
    }
  }
}
function path(a, b) {
  const parent = new Map();
  for (const [node, , from] of bfs(a)) {
    parent.set(node, from);
    if (node === b) break;                     // stop pulling: nothing past the target is visited
  }
  if (!parent.has(b)) return null;
  const route = [];
  for (let n = b; n !== null; n = parent.get(n)) route.unshift(n);
  return route;
}
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  if (cmd === "edge") link(a, b);
  else if (cmd === "bfs") console.log(`bfs ${a}: ${[...bfs(a)].map(([n, d]) => `${n}@${d}`).join(" ")}`);
  else if (cmd === "path") {
    const p = path(a, b);
    console.log(p ? `path ${a} -> ${b}: ${p.join(" ")} (${p.length - 1} hops)` : `path ${a} -> ${b}: none`);
  } else if (cmd === "degree") console.log(`degree ${a} = ${neighbours(a).size}`);
}
