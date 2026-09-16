"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Each line: `<a> | <b> | <expected>` — a test table for isAnagram, which must ignore case, spaces, punctuation and Unicode normalisation form.
const key = (s) => [...s.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")].sort().join("");   // code points, not UTF-16 units
const isAnagram = (a, b) => key(a) === key(b);
let pass = 0, fail = 0;
for (const line of lines) {
  const [a, b, expected] = line.split("|").map((p) => p.trim());
  const actual = isAnagram(a, b);
  const ok = String(actual) === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? "ok  " : "FAIL"} isAnagram(${JSON.stringify(a)}, ${JSON.stringify(b)}) -> ${actual}${ok ? "" : ` (table expected ${expected})`}`);
}
console.log(`${pass} passed, ${fail} failed`);
