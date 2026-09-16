"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [mapText, ...queries] = input.split("\n").filter((l) => l.trim() !== "");
const importMap = JSON.parse(mapText);      // { imports: { bare: url, "prefix/": url }, scopes: { scopeUrl: { bare: url } } }
function lookup(table, specifier) {
  if (Object.hasOwn(table, specifier)) return table[specifier];
  const prefixes = Object.keys(table).filter((k) => k.endsWith("/") && specifier.startsWith(k)).sort((a, b) => b.length - a.length);
  return prefixes.length ? table[prefixes[0]] + specifier.slice(prefixes[0].length) : null;
}
function resolve(specifier, referrer) {
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/") || /^[a-z]+:/i.test(specifier);
  if (!isRelative) {
    const scopes = Object.keys(importMap.scopes ?? {}).filter((s) => referrer.startsWith(s)).sort((a, b) => b.length - a.length);   // most specific scope first
    for (const s of scopes) { const hit = lookup(importMap.scopes[s], specifier); if (hit) return `${hit} (scope ${s})`; }
    const hit = lookup(importMap.imports ?? {}, specifier);
    if (hit) return hit;
    throw new TypeError(`Failed to resolve module specifier "${specifier}": bare specifiers need an import map entry`);
  }
  return new URL(specifier, referrer).href;
}
for (const q of queries) {
  const [specifier, referrer] = q.trim().split(/\s+/);
  try { console.log(`${specifier} from ${referrer} -> ${resolve(specifier, referrer)}`); }
  catch (err) { console.log(`${specifier} from ${referrer} -> ${err.name}: ${err.message}`); }
}
