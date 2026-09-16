"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sorted = (xs) => [...xs].sort((a, b) => a - b);
const percentile = (xs, p) => { const s = sorted(xs); return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))]; };   // nearest-rank
const median = (xs) => { const s = sorted(xs); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const cfg = Object.fromEntries(lines[0].trim().split(/\s+/).map((kv) => kv.split("=")));   // slo=300 target=99 queries=10
const requests = lines.slice(1).map((l) => { const [route, ms, status, queries] = l.trim().split(/\s+/); return { route, ms: Number(ms), status: Number(status), queries: Number(queries) }; });
// TODO: per-route p50/p95/p99, error rate, N+1 suspects (queries > threshold), slowest route, overall SLO compliance
