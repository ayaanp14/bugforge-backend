"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const capacities = lines[0].trim().split(/\s+/).map(Number);
const batches = lines[1].trim().split("|").map((b) => b.trim().split(/\s+/).filter(Boolean));   // keys inside a batch arrive concurrently
const HIT = 2, MISS = 60;   // ms
const total = batches.reduce((n, b) => n + b.length, 0);
for (const capacity of capacities) {
  const lru = new Map();
  let hits = 0, misses = 0, loads = 0, coalesced = 0, latency = 0;
  for (const batch of batches) {
    const inFlight = new Set();                              // single-flight: one load per key per batch
    for (const key of batch) {
      if (lru.has(key)) { hits++; latency += HIT; const v = lru.get(key); lru.delete(key); lru.set(key, v); continue; }
      misses++; latency += MISS;                             // a request that has to wait for the load, shared or not
      if (inFlight.has(key)) coalesced++; else { inFlight.add(key); loads++; }   // a duplicate joins the load already in flight
    }
    for (const key of inFlight) { lru.set(key, true); if (lru.size > capacity) lru.delete(lru.keys().next().value); }   // loads land after the batch
  }
  console.log(`capacity=${capacity}: hits=${hits} misses=${misses} (${coalesced} coalesced) hitRatio=${((hits / total) * 100).toFixed(1)}% backendLoads=${loads} avgLatency=${(latency / total).toFixed(1)}ms`);
}
console.log(`no cache: avgLatency=${MISS}ms backendLoads=${total}`);
