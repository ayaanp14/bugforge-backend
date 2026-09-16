"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const capacities = lines[0].trim().split(/\s+/).map(Number);
const batches = lines[1].trim().split("|").map((b) => b.trim().split(/\s+/).filter(Boolean));   // keys inside a batch arrive concurrently
const HIT = 2, MISS = 60;   // ms
// TODO: for each capacity run an LRU over the trace: count hits/misses, single-flight the concurrent misses in a batch (duplicates are coalesced), print hit ratio and average latency
