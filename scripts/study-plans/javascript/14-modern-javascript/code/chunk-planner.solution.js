"use strict";
const input = require("fs").readFileSync(0, "utf8");
const plan = JSON.parse(input);       // { routes: { name: [modules] }, sizes: { module: kb }, vendor: [modules] }
const vendorSet = new Set(plan.vendor ?? []);
const usage = new Map();
for (const mods of Object.values(plan.routes)) for (const m of mods) usage.set(m, (usage.get(m) ?? 0) + 1);
const chunks = { vendor: [], shared: [] };
for (const m of Object.keys(plan.sizes).sort()) {
  if (!usage.has(m)) continue;                                   // never imported by a route: not shipped at all
  if (vendorSet.has(m)) chunks.vendor.push(m);
  else if (usage.get(m) >= 2) chunks.shared.push(m);             // imported by two or more routes: hoist so it downloads once
}
for (const [route, mods] of Object.entries(plan.routes)) chunks[`route:${route}`] = mods.filter((m) => !vendorSet.has(m) && usage.get(m) < 2).sort();
const size = (mods) => mods.reduce((s, m) => s + plan.sizes[m], 0);
for (const [name, mods] of Object.entries(chunks)) console.log(`${name}: [${mods.join(", ")}] ${size(mods)} kB`);
const total = Object.values(chunks).reduce((s, mods) => s + size(mods), 0);
const naive = Object.values(plan.routes).reduce((s, mods) => s + size(mods), 0);
console.log(`total shipped=${total} kB (naive per-route copies would be ${naive} kB)`);
for (const route of Object.keys(plan.routes)) console.log(`initial load ${route}: ${size(chunks.vendor) + size(chunks.shared) + size(chunks[`route:${route}`])} kB`);
