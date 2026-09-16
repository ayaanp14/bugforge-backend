"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// alloc <id> <size> | ref <from|root> <to> | unref <from|root> <to> | scavenge | major | stats
// young objects survive two scavenges then get promoted to old space; a scavenge treats every old-space object as a root
// (the remembered set — it never looks inside old space); a major collection marks from the real roots over both spaces
const objects = new Map();   // id -> { size, refs: Set, gen: "young"|"old", age }
const roots = new Set();
let scavenges = 0, majors = 0;
function live(extraRoots = []) {
  const seen = new Set(), stack = [...roots, ...extraRoots].filter((r) => objects.has(r));
  while (stack.length) { const id = stack.pop(); if (seen.has(id)) continue; seen.add(id); for (const t of objects.get(id).refs) if (objects.has(t)) stack.push(t); }
  return seen;
}
const bytes = (gen) => [...objects.values()].filter((o) => o.gen === gen).reduce((s, o) => s + o.size, 0);
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  if (cmd === "alloc") objects.set(a, { size: Number(b), refs: new Set(), gen: "young", age: 0 });
  else if (cmd === "ref") (a === "root" ? roots.add(b) : objects.get(a).refs.add(b));
  else if (cmd === "unref") (a === "root" ? roots.delete(b) : objects.get(a).refs.delete(b));
  else if (cmd === "scavenge") {
    scavenges++;
    const old = [...objects].filter(([, o]) => o.gen === "old").map(([id]) => id);
    const reachable = live(old);                                // a dead old object still keeps its young children alive until a major GC
    const freed = [], promoted = [];
    for (const [id, o] of objects) {
      if (o.gen !== "young") continue;
      if (!reachable.has(id)) { freed.push(id); objects.delete(id); continue; }
      if (++o.age >= 2) { o.gen = "old"; promoted.push(id); }   // survived twice: promote
    }
    console.log(`scavenge #${scavenges}: freed=${freed.join(",") || "-"} promoted=${promoted.join(",") || "-"} young=${bytes("young")}B old=${bytes("old")}B`);
  } else if (cmd === "major") {
    majors++;
    const reachable = live();
    const freed = [...objects.keys()].filter((id) => !reachable.has(id));
    for (const id of freed) objects.delete(id);
    console.log(`major #${majors}: freed=${freed.join(",") || "-"} young=${bytes("young")}B old=${bytes("old")}B`);
  } else if (cmd === "stats") console.log(`stats: objects=${objects.size} young=${bytes("young")}B old=${bytes("old")}B scavenges=${scavenges} majors=${majors}`);
}
