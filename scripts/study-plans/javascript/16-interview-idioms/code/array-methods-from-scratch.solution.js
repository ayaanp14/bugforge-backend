"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Line 1: elements — numbers, NaN, words, JSON arrays like [1,[2]] and `_` for a hole. Implement the methods on Array.prototype, then compare with the natives.
const tokens = lines[0].trim().split(/\s+/);
const arr = [];
tokens.forEach((t, i) => { if (t !== "_") arr[i] = t === "NaN" ? NaN : t.startsWith("[") ? JSON.parse(t) : Number.isNaN(Number(t)) ? t : Number(t); });
arr.length = tokens.length;
const show = (a) => `[${Array.from({ length: a.length }, (_, i) => (i in a ? (typeof a[i] === "string" ? JSON.stringify(a[i]) : Array.isArray(a[i]) ? show(a[i]) : String(a[i])) : "<hole>")).join(",")}]`;
Array.prototype.myForEach = function (fn, thisArg) { for (let i = 0; i < this.length; i++) if (i in this) fn.call(thisArg, this[i], i, this); };
Array.prototype.myMap = function (fn, thisArg) { const out = new Array(this.length); for (let i = 0; i < this.length; i++) if (i in this) out[i] = fn.call(thisArg, this[i], i, this); return out; };   // holes stay holes
Array.prototype.myFilter = function (fn, thisArg) { const out = []; for (let i = 0; i < this.length; i++) if (i in this && fn.call(thisArg, this[i], i, this)) out.push(this[i]); return out; };
Array.prototype.myReduce = function (fn, ...seed) {
  let i = 0, acc;
  if (seed.length) acc = seed[0];                                              // arity, not undefined-ness, decides whether a seed was given
  else { while (i < this.length && !(i in this)) i++; if (i >= this.length) throw new TypeError("Reduce of empty array with no initial value"); acc = this[i++]; }
  for (; i < this.length; i++) if (i in this) acc = fn(acc, this[i], i, this);
  return acc;
};
Array.prototype.myFlat = function (depth = 1) { const out = []; for (let i = 0; i < this.length; i++) { if (!(i in this)) continue; if (Array.isArray(this[i]) && depth >= 1) out.push(...this[i].myFlat(depth - 1)); else out.push(this[i]); } return out; };
Array.prototype.myFlatMap = function (fn, thisArg) { return this.myMap(fn, thisArg).myFlat(1); };
Array.prototype.myIncludes = function (x) { for (let i = 0; i < this.length; i++) if (this[i] === x || (Number.isNaN(x) && Number.isNaN(this[i]))) return true; return false; };   // SameValueZero: holes read as undefined, NaN found
Array.prototype.myIndexOf = function (x) { for (let i = 0; i < this.length; i++) if (i in this && this[i] === x) return i; return -1; };   // strict equality: never finds NaN
const isNum = (x) => typeof x === "number" && !Number.isNaN(x);
const compare = (label, mine, native) => console.log(`${label}: ${mine} match=${mine === native}`);
let visitsMine = 0, visitsNative = 0;
arr.myForEach(() => visitsMine++); arr.forEach(() => visitsNative++);
compare(`forEach visits (holes skipped)`, String(visitsMine), String(visitsNative));
compare(`map x2`, show(arr.myMap((x) => (isNum(x) ? x * 2 : x))), show(arr.map((x) => (isNum(x) ? x * 2 : x))));
compare(`filter numbers`, show(arr.myFilter(isNum)), show(arr.filter(isNum)));
compare(`reduce sum`, String(arr.myReduce((a, x) => a + (isNum(x) ? x : 0), 0)), String(arr.reduce((a, x) => a + (isNum(x) ? x : 0), 0)));
const empty = (fn) => { try { return String(fn()); } catch (e) { return e.name; } };
compare(`reduce on [] without a seed`, empty(() => [].myReduce((a, b) => a + b)), empty(() => [].reduce((a, b) => a + b)));
compare(`reduce on [] with seed`, empty(() => [].myReduce((a, b) => a + b, 0)), empty(() => [].reduce((a, b) => a + b, 0)));
compare(`flat()`, show(arr.myFlat()), show(arr.flat()));
compare(`flat(Infinity)`, show(arr.myFlat(Infinity)), show(arr.flat(Infinity)));
compare(`flatMap [x,x]`, show(arr.myFlatMap((x) => (Array.isArray(x) ? x : [x, x]))), show(arr.flatMap((x) => (Array.isArray(x) ? x : [x, x]))));
compare(`includes(NaN)`, String(arr.myIncludes(NaN)), String(arr.includes(NaN)));
compare(`indexOf(NaN)`, String(arr.myIndexOf(NaN)), String(arr.indexOf(NaN)));
compare(`includes(undefined) (a hole reads as undefined)`, String(arr.myIncludes(undefined)), String(arr.includes(undefined)));
compare(`indexOf(undefined) (holes skipped)`, String(arr.myIndexOf(undefined)), String(arr.indexOf(undefined)));
