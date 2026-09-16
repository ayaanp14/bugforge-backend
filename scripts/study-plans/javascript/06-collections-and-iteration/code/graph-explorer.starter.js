"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const adjacency = new Map();   // node -> Set of neighbours
function link(a, b) {
  // TODO: undirected edge
}
function* bfs(start) {
  // TODO: yield [node, distance] in breadth-first order, neighbours in sorted order
}
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  // TODO: edge a b | bfs a | path a b | degree a
}
