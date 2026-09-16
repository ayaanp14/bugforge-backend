"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
let processed = 0, failed = 0;
function divide(a, b) {
  // TODO: TypeError unless both are finite numbers; RangeError on division by zero
}
for (const line of lines) {
  const [a, b] = line.trim().split(/\s+/);
  // TODO: try/catch/finally
}
console.log(`processed=${processed} failed=${failed}`);
