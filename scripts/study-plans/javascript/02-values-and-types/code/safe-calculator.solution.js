"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const apply = (x, op, y) => (op === "+" ? x + y : op === "-" ? x - y : x * y);
for (const line of lines) {
  const [a, op, b] = line.trim().split(/\s+/);
  const na = Number(a), nb = Number(b);
  const asNumber = apply(na, op, nb);
  if (Number.isSafeInteger(na) && Number.isSafeInteger(nb) && Number.isSafeInteger(asNumber)) {
    console.log(`${a} ${op} ${b} = ${asNumber} mode=number`);
  } else {
    console.log(`${a} ${op} ${b} = ${apply(BigInt(a), op, BigInt(b))} mode=bigint`);
  }
}
