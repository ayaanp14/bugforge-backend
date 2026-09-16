"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function evaluate(expression) {
  // TODO: SyntaxError for unknown tokens, missing operands, leftover operands; RangeError for division by zero
}
let evaluated = 0, failed = 0;
for (const line of lines) {
  // TODO
}
console.log(`evaluated=${evaluated} failed=${failed}`);
