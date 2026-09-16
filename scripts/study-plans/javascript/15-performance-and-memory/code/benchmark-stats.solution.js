"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sorted = (xs) => [...xs].sort((a, b) => a - b);
const percentile = (xs, p) => { const s = sorted(xs); return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))]; };   // nearest-rank
const median = (xs) => { const s = sorted(xs); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const warmup = Number(lines[0].replace(/^warmup=/, ""));
const stddev = (xs) => { const m = mean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); };
const mad = (xs) => { const m = median(xs); return median(xs.map((x) => Math.abs(x - m))); };
const series = lines.slice(1).map((l) => { const [name, rest] = l.split(":"); return { name: name.trim(), raw: rest.trim().split(/\s+/).map(Number) }; });
const f = (x) => x.toFixed(2);
for (const s of series) {
  s.samples = s.raw.slice(warmup);                                   // the first runs mix interpreter and JIT tiers
  const m = median(s.samples), d = mad(s.samples);
  const outliers = s.samples.filter((x) => Math.abs(x - m) > 3 * 1.4826 * d).length;   // robust outlier rule (MAD)
  console.log(`${s.name}: n=${s.samples.length} min=${f(Math.min(...s.samples))} median=${f(m)} mean=${f(mean(s.samples))} p95=${f(percentile(s.samples, 95))} stddev=${f(stddev(s.samples))} outliers=${outliers}`);
}
if (series.length >= 2) {
  const [a, b] = series;
  const q = (xs, p) => percentile(xs, p);
  const overlap = !(q(a.samples, 75) < q(b.samples, 25) || q(b.samples, 75) < q(a.samples, 25));   // interquartile ranges overlap?
  const diff = ((median(b.samples) - median(a.samples)) / median(a.samples)) * 100;
  console.log(`${b.name} vs ${a.name}: median ${diff >= 0 ? "+" : ""}${f(diff)}% -> ${overlap ? "not distinguishable (IQRs overlap)" : diff < 0 ? "faster" : "slower"}`);
}
