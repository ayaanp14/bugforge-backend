"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
class Counter {
  count = 0;
  increment() { this.count++; }
  incrementArrow = () => { this.count++; };
}
const n = Number(tokens[0]);
const later = [];                       // callbacks to run after registration, like timers would
// TODO: register n callbacks four ways — broken, arrow wrapper, bind, arrow field — then run them
