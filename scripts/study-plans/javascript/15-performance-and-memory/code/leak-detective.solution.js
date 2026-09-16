"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Each line: `snapshot <n>: Class=count Class=count ...`
const snapshots = lines.map((l) => Object.fromEntries(l.split(":")[1].trim().split(/\s+/).map((kv) => { const [k, v] = kv.split("="); return [k, Number(v)]; })));
const classes = [...new Set(snapshots.flatMap((s) => Object.keys(s)))].sort();
const suspects = [], stable = [], noisy = [];
for (const c of classes) {
  const counts = snapshots.map((s) => s[c] ?? 0);
  const growing = counts.every((v, i) => i === 0 || v > counts[i - 1]);           // strictly monotonic growth: the leak signature
  const total = counts.at(-1) - counts[0];
  if (growing && snapshots.length >= 3) suspects.push({ c, counts, perSnapshot: total / (counts.length - 1), total });
  else if (counts.every((v) => v === counts[0])) stable.push(c);
  else noisy.push(c);
}
suspects.sort((a, b) => b.total - a.total);
for (const s of suspects) console.log(`suspect ${s.c}: ${s.counts.join(" -> ")} (+${s.perSnapshot.toFixed(1)}/snapshot, +${s.total} total)`);
console.log(`stable: ${stable.join(", ") || "-"}`);
console.log(`fluctuating (normal churn): ${noisy.join(", ") || "-"}`);
console.log(suspects.length ? `verdict: likely leak in ${suspects[0].c} — find who retains them in a heap snapshot comparison` : "verdict: no monotonic growth across snapshots");
