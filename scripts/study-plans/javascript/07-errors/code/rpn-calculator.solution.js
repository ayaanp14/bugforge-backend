"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const OPS = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => { if (b === 0) throw new RangeError("division by zero"); return a / b; },
};
function evaluate(expression) {
  const stack = [];
  for (const token of expression.trim().split(/\s+/)) {
    if (Object.hasOwn(OPS, token)) {
      if (stack.length < 2) throw new SyntaxError(`not enough operands for '${token}'`);
      const b = stack.pop(), a = stack.pop();
      stack.push(OPS[token](a, b));
    } else if (/^-?\d+(\.\d+)?$/.test(token)) {
      stack.push(Number(token));
    } else {
      throw new SyntaxError(`unknown token '${token}'`);
    }
  }
  if (stack.length !== 1) throw new SyntaxError(`too many operands: ${stack.length} left on the stack`);
  return stack[0];
}
let evaluated = 0, failed = 0;
for (const line of lines) {
  try {
    console.log(`${line.trim()} = ${evaluate(line)}`);
  } catch (err) {
    failed++;
    console.log(`${err.name}: ${err.message}`);
  } finally {
    evaluated++;
  }
}
console.log(`evaluated=${evaluated} failed=${failed}`);
