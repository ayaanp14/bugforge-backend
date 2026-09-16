"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sorted = (xs) => [...xs].sort((a, b) => a - b);
const percentile = (xs, p) => { const s = sorted(xs); return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))]; };   // nearest-rank
const median = (xs) => { const s = sorted(xs); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const cfg = Object.fromEntries(lines[0].trim().split(/\s+/).map((kv) => kv.split("=")));   // slo=300 target=99.9
const slo = Number(cfg.slo), target = Number(cfg.target);
const series = lines.slice(1).map((l) => { const [name, rest] = l.split(":"); return { name: name.trim(), xs: rest.trim().split(/\s+/).map(Number) }; });
const report = {};
for (const s of series) {
  const within = s.xs.filter((x) => x <= slo).length;
  const pct = (within / s.xs.length) * 100;
  const allowedFailures = s.xs.length * (1 - target / 100);
  const burn = allowedFailures === 0 ? Infinity : (s.xs.length - within) / allowedFailures;
  report[s.name] = { p50: percentile(s.xs, 50), p95: percentile(s.xs, 95), p99: percentile(s.xs, 99), mean: mean(s.xs) };
  console.log(`${s.name}: n=${s.xs.length} p50=${report[s.name].p50} p95=${report[s.name].p95} p99=${report[s.name].p99} mean=${report[s.name].mean.toFixed(1)} withinSLO=${pct.toFixed(2)}% budgetBurn=${burn === Infinity ? "n/a" : `${(burn * 100).toFixed(0)}%`} ${pct >= target ? "OK" : "BREACH"}`);
}
if (report.before && report.after) {
  const d = ((report.after.p95 - report.before.p95) / report.before.p95) * 100;
  console.log(`p95 change: ${d >= 0 ? "+" : ""}${d.toFixed(1)}% -> ${d > 10 ? "regression" : d < -10 ? "improvement" : "no significant change"}; mean change ${(((report.after.mean - report.before.mean) / report.before.mean) * 100).toFixed(1)}% (means hide the tail)`);
}
