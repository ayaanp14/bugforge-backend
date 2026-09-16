"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sorted = (xs) => [...xs].sort((a, b) => a - b);
const percentile = (xs, p) => { const s = sorted(xs); return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))]; };   // nearest-rank
const median = (xs) => { const s = sorted(xs); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const warmup = Number(lines[0].replace(/^warmup=/, ""));
// TODO: parse `name: n n n ...` series, drop the warm-up samples, print min/median/mean/p95/stddev/outliers per series, then compare the first two
