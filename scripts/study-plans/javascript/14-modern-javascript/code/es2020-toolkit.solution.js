"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const DEFAULTS = { port: 3000, host: "localhost", retries: 3, debug: false };
const config = JSON.parse(lines[0]);
const n = Number(lines[1]);
const text = lines[2] ?? "";
const merged = { ...config };
for (const [k, v] of Object.entries(DEFAULTS)) merged[k] ??= v;          // only null/undefined take the default: 0 and "" survive
const viaOr = { ...config };
for (const [k, v] of Object.entries(DEFAULTS)) viaOr[k] ||= v;           // for contrast: falsy values are overwritten
console.log(`merged=${JSON.stringify(merged)}`);
console.log(`viaOr=${JSON.stringify(viaOr)} differs=${JSON.stringify(merged) !== JSON.stringify(viaOr)}`);
console.log(`city=${config.owner?.address?.city ?? "unknown"} firstTag=${config.tags?.[0] ?? "none"} onReady=${typeof config.onReady?.call}`);
let fact = 1n;
for (let i = 2n; i <= BigInt(n); i++) fact *= i;
console.log(`${n}! = ${fact} digits=${String(fact).length} typeof=${typeof fact} safe=${fact <= BigInt(Number.MAX_SAFE_INTEGER)}`);
let mixed;
try { mixed = fact + 1; } catch (err) { mixed = err.constructor.name; }
console.log(`bigint+number=${mixed} bigint+1n=${fact + 1n === fact + BigInt(1)}`);
const words = [...text.matchAll(/\b(\w)(\w*)\b/g)].map((m) => m[1].toUpperCase() + m[2]);
console.log(`titleCase=${words.join(" ")} dashes=${text.replaceAll(" ", "-")} million=${1_000_000} hex=${0xff_ff}`);
