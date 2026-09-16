"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
let pulled = 0;
function* naturals() { let n = 1; while (true) { pulled++; yield n++; } }
function* take(n, it) { if (n <= 0) return; for (const x of it) { yield x; if (--n === 0) return; } }
function* map(fn, it) { for (const x of it) yield fn(x); }
function* filter(pred, it) { for (const x of it) if (pred(x)) yield x; }
function* flatten(list) { for (const x of list) { if (Array.isArray(x)) yield* flatten(x); else yield x; } }
const [k, m] = lines[0].trim().split(/\s+/).map(Number);
const nested = JSON.parse(lines[1]);
const result = [...take(k, map((x) => x * x, filter((x) => x % m === 0, naturals())))];
console.log(`result=${JSON.stringify(result)} pulled=${pulled}`);
console.log(`flatten=${JSON.stringify([...flatten(nested)])}`);
const g = take(2, naturals());
console.log(`manual=${JSON.stringify(g.next())} ${JSON.stringify(g.next())} ${JSON.stringify(g.next())}`);
