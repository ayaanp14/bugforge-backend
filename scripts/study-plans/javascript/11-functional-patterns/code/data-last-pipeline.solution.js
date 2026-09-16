"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const curry = (fn) => function c(...a) { return a.length >= fn.length ? fn(...a) : (...m) => c(...a, ...m); };
const pipe = (...fns) => (x) => fns.reduce((acc, f) => f(acc), x);
const map = curry((f, xs) => xs.map(f));
const filter = curry((p, xs) => xs.filter(p));
const sortBy = curry((key, xs) => [...xs].sort((p, q) => (p[key] < q[key] ? -1 : p[key] > q[key] ? 1 : 0)));
const take = curry((k, xs) => xs.slice(0, k));
const prop = (k) => (o) => o[k];
const countBy = curry((f, xs) => xs.reduce((m, x) => m.set(f(x), (m.get(f(x)) ?? 0) + 1), new Map()));
const n = Number(lines[0]);
const people = lines.slice(1).map((l) => { const [name, age, city] = l.trim().split(/\s+/); return { name, age: Number(age), city }; });
const youngestAdults = pipe(filter((p) => p.age >= 18), sortBy("age"), map(prop("name")), take(n));
console.log(`youngestAdults=${JSON.stringify(youngestAdults(people))}`);
const byCity = pipe(countBy(prop("city")), (m) => [...m].sort(([x], [y]) => x.localeCompare(y)).map(([c, k]) => `${c}=${k}`).join(" "));
console.log(`byCity=${byCity(people)}`);
const namesOver = (age) => pipe(filter((p) => p.age > age), map(prop("name")));   // a pipeline built from a parameter
console.log(`over30=${JSON.stringify(namesOver(30)(people))} reusedOnSubset=${JSON.stringify(youngestAdults(people.slice(0, 2)))}`);
