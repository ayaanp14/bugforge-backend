"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Minimum versions per runtime; kind decides the remedy when a target lacks a feature.
const TABLE = {
  "optional-chaining": { kind: "syntax", node: 14, chrome: 80, safari: 13.1 },
  "class-fields": { kind: "syntax", node: 12, chrome: 72, safari: 14.1 },
  "top-level-await": { kind: "syntax", node: 14.8, chrome: 89, safari: 15 },
  "using": { kind: "syntax", node: Infinity, chrome: 134, safari: Infinity },
  "replaceAll": { kind: "builtin", node: 15, chrome: 85, safari: 13.1 },
  "at": { kind: "builtin", node: 16.6, chrome: 92, safari: 15.4 },
  "structuredClone": { kind: "builtin", node: 17, chrome: 98, safari: 15.4 },
  "toSorted": { kind: "builtin", node: 20, chrome: 110, safari: 16 },
  "groupBy": { kind: "builtin", node: 21, chrome: 117, safari: 17.4 },
  "fetch": { kind: "builtin", node: 18, chrome: 42, safari: 10.1 },
};
const tokens = lines[0].trim().split(/\s+/);
const targets = [];
for (let i = 0; i + 1 < tokens.length; i += 2) targets.push({ runtime: tokens[i], version: tokens[i + 1] });
const parts = (v) => String(v).split(".").map(Number);
const atLeast = (version, min) => {                             // compare as [major, minor], never as floats: 16.17 is newer than 16.6
  if (min === Infinity) return false;
  const a = parts(version), b = parts(min);
  for (let i = 0; i < Math.max(a.length, b.length); i++) { const x = a[i] ?? 0, y = b[i] ?? 0; if (x !== y) return x > y; }
  return true;
};
const polyfills = [], transpile = [];
for (const feature of lines.slice(1).map((l) => l.trim())) {
  const row = TABLE[feature];
  if (!row) { console.log(`${feature}: unknown feature`); continue; }
  const missing = targets.filter((t) => !(t.runtime in row) || !atLeast(t.version, row[t.runtime])).map((t) => `${t.runtime} ${t.version}`);
  if (!missing.length) { console.log(`${feature}: supported everywhere`); continue; }
  const remedy = row.kind === "syntax" ? "transpile" : "polyfill";
  (remedy === "transpile" ? transpile : polyfills).push(feature);
  console.log(`${feature}: ${remedy} (missing in ${missing.join(", ")})`);
}
const LEVELS = { node: [["18", 2022], ["16", 2021], ["14", 2020]], chrome: [["94", 2022], ["85", 2021], ["80", 2020]], safari: [["15.4", 2022], ["14.1", 2021], ["13.1", 2020]] };
const esLevel = (t) => (LEVELS[t.runtime] ?? []).find(([min]) => atLeast(t.version, min))?.[1] ?? 2019;
console.log(`transpile target: ES${Math.min(...targets.map(esLevel))}`);
console.log(`polyfills: ${polyfills.join(", ") || "none"}`);
console.log(`syntax to transpile: ${transpile.join(", ") || "none"}`);
