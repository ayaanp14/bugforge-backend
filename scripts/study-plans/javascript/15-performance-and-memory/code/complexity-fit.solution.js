"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const points = lines.map((l) => l.trim().split(/\s+/).map(Number));   // [n, operations]
const MODELS = {
  "O(1)": () => 1, "O(log n)": (n) => Math.log2(n), "O(n)": (n) => n, "O(n log n)": (n) => n * Math.log2(n), "O(n^2)": (n) => n * n,
};
const cv = (xs) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; const sd = Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length); return m === 0 ? Infinity : sd / m; };
const scores = Object.entries(MODELS).map(([name, f]) => [name, cv(points.map(([n, ops]) => ops / f(n)))]).sort((a, b) => a[1] - b[1]);
for (const [name, c] of scores) console.log(`${name.padEnd(10)} cv=${c.toFixed(3)}`);
console.log(`best fit: ${scores[0][0]}`);
const [n1, o1] = points[0], [n2, o2] = points.at(-1);
console.log(`n x${(n2 / n1).toFixed(1)} -> ops x${(o2 / o1).toFixed(1)}`);
