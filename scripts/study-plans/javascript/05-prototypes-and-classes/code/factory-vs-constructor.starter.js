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
// TODO: compare the two kinds
