"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// A model of the layout engine: writes dirty the layout; a read while dirty forces a synchronous reflow.
const engine = { dirty: false, reflows: 0, write() { this.dirty = true; }, read() { if (this.dirty) { this.reflows++; this.dirty = false; } } };
const heights = lines[0].trim().split(/\s+/).map(Number);
function naive() {
  engine.reflows = 0; engine.dirty = true;
  const out = [];
  for (const h of heights) { engine.write(); engine.read(); out.push(h * 2); }     // write, then measure — a reflow per item
  engine.read();                                                                     // the frame's own layout pass (nothing dirty here)
  return { reflows: engine.reflows, out };
}
function batched() {
  engine.reflows = 0; engine.dirty = true;
  const measured = heights.map((h) => { engine.read(); return h; });                 // all reads first: one reflow
  const out = measured.map((h) => { engine.write(); return h * 2; });                // then all writes: no reads in between
  engine.read();                                                                     // one layout pass at the frame
  return { reflows: engine.reflows, out };
}
function withFrame() {
  engine.reflows = 0; engine.dirty = true;
  const pending = [];
  const requestAnimationFrame = (cb) => pending.push(cb);                             // writes queued for the next frame
  const out = [];
  for (const h of heights) { engine.read(); requestAnimationFrame(() => { engine.write(); out.push(h * 2); }); }
  for (const cb of pending) cb();                                                    // the frame: every write, then the browser lays out once
  engine.read();
  return { reflows: engine.reflows, out };
}
const a = naive(), b = batched(), c = withFrame();
console.log(`naive: reflows=${a.reflows} for ${heights.length} items`);
console.log(`batched: reflows=${b.reflows}`);
console.log(`requestAnimationFrame: reflows=${c.reflows}`);
console.log(`sameResult=${JSON.stringify(a.out) === JSON.stringify(b.out) && JSON.stringify(b.out) === JSON.stringify(c.out)} out=${JSON.stringify(c.out)}`);
