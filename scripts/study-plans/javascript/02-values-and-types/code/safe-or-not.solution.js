"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);
for (let i = 1; i <= n; i++) {
  const t = tokens[i];
  const v = Number(t);
  const parts = [`value=${v}`, `finite=${Number.isFinite(v)}`, `safeInteger=${Number.isSafeInteger(v)}`];
  if (/^-?\d+$/.test(t)) parts.push(`bigint=${BigInt(t).toString()}`);
  console.log(`${t}: ${parts.join(" ")}`);
}
