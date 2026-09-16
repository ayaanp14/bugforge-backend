"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sorted = (xs) => [...xs].sort((a, b) => a - b);
const percentile = (xs, p) => { const s = sorted(xs); return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))]; };   // nearest-rank
const median = (xs) => { const s = sorted(xs); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const cfg = Object.fromEntries(lines[0].trim().split(/\s+/).map((kv) => kv.split("=")));   // slo=300 target=99 queries=10
const requests = lines.slice(1).map((l) => { const [route, ms, status, queries] = l.trim().split(/\s+/); return { route, ms: Number(ms), status: Number(status), queries: Number(queries) }; });
const slo = Number(cfg.slo), target = Number(cfg.target), queryLimit = Number(cfg.queries);
const byRoute = new Map();
for (const r of requests) (byRoute.get(r.route) ?? byRoute.set(r.route, []).get(r.route)).push(r);
const rows = [...byRoute].map(([route, rs]) => {
  const ms = rs.map((r) => r.ms);
  return { route, n: rs.length, p50: percentile(ms, 50), p95: percentile(ms, 95), p99: percentile(ms, 99), errors: rs.filter((r) => r.status >= 500).length, nPlusOne: rs.filter((r) => r.queries > queryLimit).length, maxQueries: Math.max(...rs.map((r) => r.queries)) };
}).sort((a, b) => b.p95 - a.p95);
for (const r of rows) console.log(`${r.route}: n=${r.n} p50=${r.p50} p95=${r.p95} p99=${r.p99} errors=${r.errors} n+1suspects=${r.nPlusOne} maxQueries=${r.maxQueries}`);
const within = requests.filter((r) => r.ms <= slo && r.status < 500).length;
const pct = (within / requests.length) * 100;
console.log(`slowest by p95: ${rows[0].route}`);
console.log(`SLO ${slo}ms @ ${target}%: ${pct.toFixed(1)}% good -> ${pct >= target ? "met" : "missed"}; error budget used=${Math.min(999, ((requests.length - within) / Math.max(1e-9, requests.length * (1 - target / 100))) * 100).toFixed(0)}%`);
const worst = requests.filter((r) => r.queries > queryLimit).sort((a, b) => b.queries - a.queries)[0];
console.log(worst ? `N+1 candidate: ${worst.route} ran ${worst.queries} queries in one request (limit ${queryLimit}) - batch them` : "N+1: none over the limit");
