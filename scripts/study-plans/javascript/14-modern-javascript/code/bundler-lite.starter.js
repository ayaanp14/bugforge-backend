"use strict";
const input = require("fs").readFileSync(0, "utf8");
// Modules are text blocks starting `// file: name.js`; statements: `import { a, b } from "./x.js";`, `export const a = ...;`, `export function f() { ... }` (one line each), other lines are kept as-is.
const modules = new Map();
// TODO: parse blocks; walk from the entry (line 1: `entry: name.js`); order dependencies first; drop exports nothing imports (except the entry's); emit `// ---- name.js` + lines with import/export keywords removed; report dropped
