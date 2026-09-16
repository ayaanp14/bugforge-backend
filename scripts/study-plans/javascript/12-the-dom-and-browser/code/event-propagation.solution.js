"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Nodes are declared as paths: `document > body > ul#list > li#a > button#b`
const nodes = new Map();      // id -> { id, parent, listeners: [] }
function declare(pathLine) {
  const ids = pathLine.split(">").map((s) => s.trim().replace(/^[a-z0-9]*#?/, "") || s.trim());
  let parent = null;
  for (const id of ids) {
    if (!nodes.has(id)) nodes.set(id, { id, parent, listeners: [] });
    parent = nodes.get(id);
  }
}
function dispatch(targetId, type) {
  const target = nodes.get(targetId);
  const path = [];
  for (let n = target.parent; n; n = n.parent) path.unshift(n);      // root ... parent
  const event = { type, target: targetId, defaultPrevented: false, stopped: false, stoppedImmediate: false };
  const run = (node, phase, filter) => {
    for (const l of node.listeners) {
      if (l.type !== type || !filter(l)) continue;
      console.log(`${l.label} @${node.id} target=${event.target} phase=${phase}`);
      if (l.flag === "prevent") event.defaultPrevented = true;
      if (l.flag === "stop") event.stopped = true;
      if (l.flag === "stopImmediate") { event.stopped = true; event.stoppedImmediate = true; return; }
    }
  };
  for (const n of path) { if (event.stopped) break; run(n, "capture", (l) => l.capture); }
  if (!event.stopped) { run(target, "target", (l) => l.capture); if (!event.stoppedImmediate) run(target, "target", (l) => !l.capture); }
  for (const n of [...path].reverse()) { if (event.stopped) break; run(n, "bubble", (l) => !l.capture); }
  console.log(`dispatch ${type} on ${targetId}: defaultPrevented=${event.defaultPrevented}`);
}
for (const line of lines) {
  const text = line.trim();
  if (text.includes(">")) { declare(text); continue; }
  const [cmd, node, type, phase, label, flag] = text.split(/\s+/);
  if (cmd === "on") nodes.get(node).listeners.push({ type, capture: phase === "capture", label, flag });
  else if (cmd === "dispatch") dispatch(node, type);
}
