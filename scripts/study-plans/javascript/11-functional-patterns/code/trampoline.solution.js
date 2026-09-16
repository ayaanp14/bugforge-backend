"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const n = Number(lines[0]);
function trampoline(f) {
  return (...args) => {
    let result = f(...args);
    while (typeof result === "function") result = result();     // each bounce is a shallow call
    return result;
  };
}
const sumTo = trampoline(function go(k, acc = 0) { return k === 0 ? acc : () => go(k - 1, acc + k); });
const sumLoop = (k) => { let acc = 0; while (k > 0) acc += k--; return acc; };
const isEven = trampoline(function even(k) { return k === 0 ? true : () => odd(k - 1); });
function odd(k) { return k === 0 ? false : () => even(k - 1); }
function even(k) { return k === 0 ? true : () => odd(k - 1); }
let bounces = 0;
const counted = trampoline(function go(k) { bounces++; return k === 0 ? "done" : () => go(k - 1); });
const t = sumTo(n), l = sumLoop(n);
console.log(`sumTo=${t} sumLoop=${l} equal=${t === l}`);
console.log(`isEven(${n})=${isEven(n)} isEven(${n + 1})=${isEven(n + 1)}`);
console.log(`bounces for ${n}: ${(counted(n), bounces)} result=${counted(0)}`);
const plain = (k, acc = 0) => (k === 0 ? acc : plain(k - 1, acc + k));
console.log(`plainRecursion(2000)=${plain(2000)} (small depths are fine without a trampoline)`);
