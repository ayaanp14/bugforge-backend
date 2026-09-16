"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// A model of the layout engine: writes dirty the layout; a read while dirty forces a synchronous reflow.
const engine = { dirty: false, reflows: 0, write() { this.dirty = true; }, read() { if (this.dirty) { this.reflows++; this.dirty = false; } } };
const heights = lines[0].trim().split(/\s+/).map(Number);
// TODO: naive (write then read per item) vs batched (all reads, then all writes) vs rAF-style (collect writes, flush once)
