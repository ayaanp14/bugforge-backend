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
// TODO: parse targets (`node 16.17 chrome 100 safari 15.4`), then for each requested feature report supported / polyfill / transpile with the failing targets
