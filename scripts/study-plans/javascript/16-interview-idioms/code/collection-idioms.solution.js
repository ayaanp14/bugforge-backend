"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Line 1: records `name:dept:age`; then commands: count <field> | group <field> | unique <field> | sort <field> <field> | chunk <n> | top <k> <field> | range <a> <b> | zip <field> <field> | minmax <field> | dedupe-by <field>
const records = lines[0].trim().split(/\s+/).map((r) => { const [name, dept, age] = r.split(":"); return { name, dept, age: Number(age) }; });
const countBy = (f) => { const m = new Map(); for (const r of records) m.set(r[f], (m.get(r[f]) ?? 0) + 1); return m; };
const groupBy = (f) => { const m = new Map(); for (const r of records) (m.get(r[f]) ?? m.set(r[f], []).get(r[f])).push(r); return m; };
const cmp = (f) => (a, b) => (typeof a[f] === "number" ? a[f] - b[f] : a[f].localeCompare(b[f]));
for (const line of lines.slice(1)) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  if (cmd === "count") console.log(`count ${args[0]}: ${[...countBy(args[0])].map(([k, v]) => `${k}=${v}`).join(" ")}`);
  else if (cmd === "group") console.log(`group ${args[0]}: ${[...groupBy(args[0])].map(([k, rs]) => `${k}=[${rs.map((r) => r.name).join(",")}]`).join(" ")}`);
  else if (cmd === "unique") console.log(`unique ${args[0]}: ${[...new Set(records.map((r) => r[args[0]]))].join(",")}`);
  else if (cmd === "sort") { const sorted = [...records].sort((a, b) => cmp(args[0])(a, b) || cmp(args[1])(a, b)); console.log(`sort ${args.join(",")}: ${sorted.map((r) => `${r.name}(${r[args[0]]})`).join(" ")}`); }   // copy first: sort mutates
  else if (cmd === "chunk") { const n = Number(args[0]); const chunks = Array.from({ length: Math.ceil(records.length / n) }, (_, i) => records.slice(i * n, i * n + n)); console.log(`chunk ${n}: ${chunks.map((c) => `[${c.map((r) => r.name).join(",")}]`).join(" ")}`); }
  else if (cmd === "top") { const k = Number(args[0]); const top = [...countBy(args[1])].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, k); console.log(`top ${k} ${args[1]}: ${top.map(([v, n]) => `${v}=${n}`).join(" ")}`); }
  else if (cmd === "range") { const [a, b] = args.map(Number); console.log(`range ${a}..${b}: ${Array.from({ length: b - a + 1 }, (_, i) => a + i).join(",")}`); }
  else if (cmd === "zip") console.log(`zip ${args[0]},${args[1]}: ${records.map((r) => `${r[args[0]]}=${r[args[1]]}`).join(" ")}`);
  else if (cmd === "minmax") { const [lo, hi] = records.reduce(([lo, hi], r) => [Math.min(lo, r[args[0]]), Math.max(hi, r[args[0]])], [Infinity, -Infinity]); console.log(`minmax ${args[0]}: ${lo}..${hi}`); }   // never Math.max(...huge)
  else if (cmd === "dedupe-by") { const last = [...new Map(records.map((r) => [r[args[0]], r])).values()]; console.log(`dedupe-by ${args[0]}: ${last.map((r) => `${r.name}(${r[args[0]]})`).join(" ")}`); }   // last record per key wins
}
