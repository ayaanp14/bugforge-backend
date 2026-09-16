"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const heap = new Map();    // id -> { size, refs: Set }
const roots = new Set();
function mark() {
  const live = new Set();
  const stack = [...roots].filter((r) => heap.has(r));
  while (stack.length) {
    const id = stack.pop();
    if (live.has(id)) continue;
    live.add(id);
    for (const to of heap.get(id).refs) if (heap.has(to)) stack.push(to);
  }
  return live;
}
function retainers(target) {
  const prev = new Map();
  const queue = [...roots].filter((r) => heap.has(r));
  for (const r of queue) prev.set(r, null);
  while (queue.length) {
    const id = queue.shift();
    if (id === target) { const path = []; for (let n = id; n !== null; n = prev.get(n)) path.unshift(n); return path; }
    for (const to of heap.get(id).refs) if (heap.has(to) && !prev.has(to)) { prev.set(to, id); queue.push(to); }
  }
  return null;
}
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  if (cmd === "alloc") heap.set(a, { size: Number(b ?? 1), refs: new Set() });
  else if (cmd === "ref") (a === "root" ? roots.add(b) : heap.get(a).refs.add(b));
  else if (cmd === "unref") (a === "root" ? roots.delete(b) : heap.get(a).refs.delete(b));
  else if (cmd === "gc") {
    const live = mark();
    const dead = [...heap.keys()].filter((id) => !live.has(id));
    const freed = dead.reduce((s, id) => s + heap.get(id).size, 0);
    for (const id of dead) heap.delete(id);
    console.log(`gc: freed ${dead.join(",") || "nothing"} (${freed} bytes) live=${[...live].join(",") || "-"} heap=${[...heap.values()].reduce((s, o) => s + o.size, 0)} bytes`);
  } else if (cmd === "retainers") {
    const path = heap.has(a) ? retainers(a) : null;
    console.log(`retainers ${a}: ${path ? `root -> ${path.join(" -> ")}` : heap.has(a) ? "unreachable (garbage)" : "not allocated"}`);
  }
}
