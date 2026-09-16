"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Line 1: elements — numbers, NaN, words, JSON arrays like [1,[2]] and `_` for a hole. Implement the methods on Array.prototype, then compare with the natives.
const tokens = lines[0].trim().split(/\s+/);
const arr = [];
tokens.forEach((t, i) => { if (t !== "_") arr[i] = t === "NaN" ? NaN : t.startsWith("[") ? JSON.parse(t) : Number.isNaN(Number(t)) ? t : Number(t); });
arr.length = tokens.length;
const show = (a) => `[${Array.from({ length: a.length }, (_, i) => (i in a ? (typeof a[i] === "string" ? JSON.stringify(a[i]) : Array.isArray(a[i]) ? show(a[i]) : String(a[i])) : "<hole>")).join(",")}]`;
// TODO: myForEach, myMap, myFilter, myReduce, myFlat, myFlatMap, myIncludes, myIndexOf — holes skipped, thisArg honoured, reduce throws on empty without a seed, includes finds NaN
