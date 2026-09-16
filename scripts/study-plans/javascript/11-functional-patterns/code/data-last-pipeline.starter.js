"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const curry = (fn) => function c(...a) { return a.length >= fn.length ? fn(...a) : (...m) => c(...a, ...m); };
const pipe = (...fns) => (x) => fns.reduce((acc, f) => f(acc), x);
// TODO: data-last curried map, filter, sortBy, take, prop, countBy; then the two pipelines
const n = Number(lines[0]);
const people = lines.slice(1).map((l) => { const [name, age, city] = l.trim().split(/\s+/); return { name, age: Number(age), city }; });
