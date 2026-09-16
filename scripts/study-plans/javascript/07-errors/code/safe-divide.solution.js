"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
let processed = 0, failed = 0;
function divide(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new TypeError(`operands must be finite numbers, got ${a} and ${b}`);
  if (b === 0) throw new RangeError("division by zero");
  return a / b;
}
for (const line of lines) {
  const [a, b] = line.trim().split(/\s+/);
  try {
    console.log(`${a} / ${b} = ${divide(Number(a), Number(b))}`);
  } catch (err) {
    failed++;
    console.log(`${err.name}: ${err.message}`);
  } finally {
    processed++;                       // runs on both paths
  }
}
console.log(`processed=${processed} failed=${failed}`);
