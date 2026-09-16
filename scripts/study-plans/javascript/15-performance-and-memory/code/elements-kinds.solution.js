"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Tokens: integers, decimals, `_` for a hole, anything else is a non-number element.
const RANK = { SMI: 0, DOUBLE: 1, ELEMENTS: 2 };
function kindAfter(kind, token) {
  let [packing, type] = kind.split("_");
  if (token === "_") packing = "HOLEY";                                       // a hole is permanent
  else {
    const t = /^-?\d+$/.test(token) ? "SMI" : /^-?\d+\.\d+$/.test(token) ? "DOUBLE" : "ELEMENTS";
    if (RANK[t] > RANK[type]) type = t;                                        // SMI -> DOUBLE -> ELEMENTS, never back
  }
  return `${packing}_${type}`;
}
for (const line of lines) {
  const tokens = line.trim().split(/\s+/);
  let kind = "PACKED_SMI";
  const path = [kind];
  for (const t of tokens) { const next = kindAfter(kind, t); if (next !== kind) path.push(next); kind = next; }
  console.log(`[${tokens.join(" ")}] => ${path.join(" -> ")}`);
}
