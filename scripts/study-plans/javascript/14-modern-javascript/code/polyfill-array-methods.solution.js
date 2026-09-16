"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function define(name, fn) {
  if (!Array.prototype[name]) Object.defineProperty(Array.prototype, name, { value: fn, writable: true, configurable: true, enumerable: false });
}
define("toSorted", function (compareFn) { return [...this].sort(compareFn); });
define("toReversed", function () { return [...this].reverse(); });
define("with", function (index, value) {
  const i = index < 0 ? this.length + index : index;
  if (i < 0 || i >= this.length) throw new RangeError(`Invalid index : ${index}`);
  const copy = [...this]; copy[i] = value; return copy;
});
define("toSpliced", function (start, deleteCount, ...items) { const copy = [...this]; copy.splice(start, deleteCount, ...items); return copy; });
define("findLast", function (pred) { for (let i = this.length - 1; i >= 0; i--) if (pred(this[i], i, this)) return this[i]; return undefined; });
define("findLastIndex", function (pred) { for (let i = this.length - 1; i >= 0; i--) if (pred(this[i], i, this)) return i; return -1; });
const arr = JSON.parse(lines[0]);
const snapshot = JSON.stringify(arr);
console.log(`toSorted=${JSON.stringify(arr.toSorted((a, b) => a - b))} toReversed=${JSON.stringify(arr.toReversed())}`);
console.log(`with(0, 99)=${JSON.stringify(arr.with(0, 99))} with(-1, 0)=${JSON.stringify(arr.with(-1, 0))}`);
let outOfRange;
try { arr.with(99, 1); outOfRange = "no error"; } catch (err) { outOfRange = err.constructor.name; }
console.log(`with(99)=${outOfRange} toSpliced(1, 2, 7)=${JSON.stringify(arr.toSpliced(1, 2, 7))}`);
console.log(`findLast(even)=${arr.findLast((x) => x % 2 === 0)} findLastIndex(even)=${arr.findLastIndex((x) => x % 2 === 0)}`);
const keysSeen = [];
for (const k in arr) keysSeen.push(k);
console.log(`original unchanged=${JSON.stringify(arr) === snapshot} forInKeys=${keysSeen.join(",")} enumerable(toSorted)=${Object.getOwnPropertyDescriptor(Array.prototype, "toSorted").enumerable}`);
