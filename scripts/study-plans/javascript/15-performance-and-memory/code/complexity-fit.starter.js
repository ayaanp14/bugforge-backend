"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const points = lines.map((l) => l.trim().split(/\s+/).map(Number));   // [n, operations]
const MODELS = {
  "O(1)": () => 1, "O(log n)": (n) => Math.log2(n), "O(n)": (n) => n, "O(n log n)": (n) => n * Math.log2(n), "O(n^2)": (n) => n * n,
};
// TODO: for each model compute ops / f(n) per point and its coefficient of variation (stddev / mean); the smallest CV is the best fit
