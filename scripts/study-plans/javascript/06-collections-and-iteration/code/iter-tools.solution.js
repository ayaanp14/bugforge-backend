"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function* chunk(it, size) {
  let buffer = [];
  for (const x of it) {
    buffer.push(x);
    if (buffer.length === size) { yield buffer; buffer = []; }
  }
  if (buffer.length) yield buffer;
}
function* zip(...its) {
  const iterators = its.map((it) => it[Symbol.iterator]());
  while (true) {
    const results = iterators.map((i) => i.next());
    if (results.some((r) => r.done)) return;
    yield results.map((r) => r.value);
  }
}
function* enumerate(it, start = 0) { let i = start; for (const x of it) yield [i++, x]; }
function* takeWhile(pred, it) { for (const x of it) { if (!pred(x)) return; yield x; } }
const a = lines[0].trim().split(/\s+/).map(Number);
const b = lines[1].trim().split(/\s+/);
const size = Number(lines[2]);
const limit = Number(lines[3]);
console.log(`chunks=${JSON.stringify([...chunk(a, size)])}`);
console.log(`zip=${JSON.stringify([...zip(a, b)])}`);
console.log(`enumerate=${JSON.stringify([...enumerate(b, 1)])}`);
console.log(`takeWhile=${JSON.stringify([...takeWhile((x) => x < limit, a)])}`);
console.log(`zipString=${[...zip("abc", a)].map(([c, n]) => c + n).join(",")}`);
