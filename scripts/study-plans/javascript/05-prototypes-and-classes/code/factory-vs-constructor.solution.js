"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
function Point(x, y) { this.x = x; this.y = y; }
Point.prototype.dist = function () { return Math.hypot(this.x, this.y); };
function makePoint(x, y) { return { x, y, dist() { return Math.hypot(x, y); } }; }
const n = Number(tokens[0]);
const built = [], made = [];
for (let i = 0; i < n; i++) {
  const x = Number(tokens[1 + 2 * i]), y = Number(tokens[2 + 2 * i]);
  built.push(new Point(x, y));
  made.push(makePoint(x, y));
}
for (let i = 0; i < n; i++) console.log(`#${i}: ctor=${built[i].dist().toFixed(2)} factory=${made[i].dist().toFixed(2)} equal=${built[i].dist() === made[i].dist()}`);
console.log(`instanceof: ctor=${built.every((p) => p instanceof Point)} factory=${made.some((p) => p instanceof Point)}`);
console.log(`keys: ctor=${Object.keys(built[0] ?? {}).join(",")} factory=${Object.keys(made[0] ?? {}).join(",")}`);
const shared = (list) => list.length < 2 ? "n/a" : String(list.every((p) => p.dist === list[0].dist));
console.log(`methodShared: ctor=${shared(built)} factory=${shared(made)}`);
console.log(`constructor: ctor=${built[0] ? built[0].constructor.name : "-"} factory=${made[0] ? made[0].constructor.name : "-"}`);
