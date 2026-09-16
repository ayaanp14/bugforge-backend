"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const nums = tokens.slice(1, Number(tokens[0]) + 1).map(Number);
console.log(`evensSquared=${JSON.stringify(nums.filter((x) => x % 2 === 0).map((x) => x * x))}`);
console.log(`sum=${nums.reduce((a, b) => a + b, 0)}`);
console.log(`firstOver10=${nums.find((x) => x > 10) ?? "none"}`);
console.log(`anyNegative=${nums.some((x) => x < 0)} allPositive=${nums.every((x) => x > 0)}`);
console.log(`mirrored=${JSON.stringify(nums.flatMap((x) => (x === 0 ? [] : [x, -x])))}`);
console.log(`distinct=${JSON.stringify([...new Set(nums)])}`);
