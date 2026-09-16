"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const syntax = (src) => () => { try { new Function(src); return true; } catch { return false; } };   // parse without running: a SyntaxError means the runtime lacks the syntax
const checks = {
  "optional-chaining": { kind: "syntax", present: syntax("return a?.b") },
  "nullish-assignment": { kind: "syntax", present: syntax("let a; a ??= 1") },
  "class-static-blocks": { kind: "syntax", present: syntax("class A { static { } }") },
  "private-in": { kind: "syntax", present: syntax("class A { #x; static has(o) { return #x in o; } }") },
  "numeric-separators": { kind: "syntax", present: syntax("return 1_000") },
  "using-declarations": { kind: "syntax", present: syntax("using x = null") },
  "regex-v-flag": { kind: "syntax", present: () => { try { new RegExp("[a]", "v"); return true; } catch { return false; } } },
  "top-level-await": { kind: "syntax", present: () => false },       // cannot be detected from CommonJS; ESM only
  "Array.prototype.at": { kind: "builtin", present: () => typeof Array.prototype.at === "function" },
  "Object.hasOwn": { kind: "builtin", present: () => typeof Object.hasOwn === "function" },
  "String.prototype.replaceAll": { kind: "builtin", present: () => typeof String.prototype.replaceAll === "function" },
  "Promise.any": { kind: "builtin", present: () => typeof Promise.any === "function" },
  "AggregateError": { kind: "builtin", present: () => typeof AggregateError === "function" },
  "WeakRef": { kind: "builtin", present: () => typeof WeakRef === "function" },
  "Intl.Segmenter": { kind: "builtin", present: () => typeof Intl.Segmenter === "function" },
  "structuredClone": { kind: "builtin", present: () => typeof globalThis.structuredClone === "function" },
  "fetch": { kind: "builtin", present: () => typeof globalThis.fetch === "function" },
  "Array.prototype.findLast": { kind: "builtin", present: () => typeof Array.prototype.findLast === "function" },
  "Array.prototype.toSorted": { kind: "builtin", present: () => typeof Array.prototype.toSorted === "function" },
  "Object.groupBy": { kind: "builtin", present: () => typeof Object.groupBy === "function" },
  "Promise.withResolvers": { kind: "builtin", present: () => typeof Promise.withResolvers === "function" },
  "AbortSignal.timeout": { kind: "builtin", present: () => typeof AbortSignal.timeout === "function" },
};
for (const name of lines.map((l) => l.trim())) {
  const check = checks[name];
  if (!check) { console.log(`${name}: unknown feature`); continue; }
  console.log(`${name}: ${check.present() ? "native" : `missing -> ${check.kind === "syntax" ? "transpile" : "polyfill"}`}`);
}
