"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const ada = { name: "Ada", who() { return this === undefined ? "undefined" : this.name; }, viaArrow() { return [1].map(() => this.name)[0]; } };
const bo = { name: "Bo" };
function Thing(name) { this.name = name; }
const n = Number(tokens[0]);
for (let i = 1; i <= n; i++) {
  const kind = tokens[i];
  // TODO: method | detached | bound | call | arrow-in-method | new
}
