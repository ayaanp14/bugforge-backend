"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
class Counter {
  count = 0;
  increment() { this.count++; }
  incrementArrow = () => { this.count++; };
}
const n = Number(tokens[0]);
const later = [];
const broken = new Counter(), wrapped = new Counter(), bound = new Counter(), field = new Counter();
for (let i = 0; i < n; i++) {
  later.push(broken.increment);            // detached: this will be undefined
  later.push(() => wrapped.increment());   // arrow wrapper keeps the dot call
  later.push(bound.increment.bind(bound)); // bound copy
  later.push(field.incrementArrow);        // arrow class field: this fixed at construction
}
let errors = 0;
for (const cb of later) {
  try { cb(); } catch (e) { errors++; }
}
console.log(`broken=${broken.count} errors=${errors}`);
console.log(`wrapped=${wrapped.count} bound=${bound.count} field=${field.count}`);
