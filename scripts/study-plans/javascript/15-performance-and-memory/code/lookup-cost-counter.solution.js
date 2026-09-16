"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const ids = lines[0].trim().split(/\s+/);
const queries = lines[1].trim().split(/\s+/);
let comparisons = 0, found = 0;
for (const q of queries) {
  let hit = false;
  for (const id of ids) { comparisons++; if (id === q) { hit = true; break; } }        // what includes() does: a scan per query
  if (hit) found++;
}
const set = new Set(ids);
const setOps = queries.length;                                                          // one hash probe per query
const setFound = queries.filter((q) => set.has(q)).length;
console.log(`includes: comparisons=${comparisons} found=${found} | Set: probes=${setOps} found=${setFound} | ratio=${(comparisons / setOps).toFixed(1)}x`);
let moves = 0;
const queue = [...ids];
while (queue.length) { moves += queue.length - 1; queue.shift(); }                       // shift moves every remaining element down one slot
let index = 0, pointerOps = 0;
while (index < ids.length) { index++; pointerOps++; }                                    // an index pointer: one step per item
console.log(`queue of ${ids.length}: shift moves=${moves} (O(n^2)) | index pointer steps=${pointerOps} (O(n))`);
console.log(`worst case for ${ids.length} ids: scan=${ids.length} comparisons per miss, Set=1 probe`);
