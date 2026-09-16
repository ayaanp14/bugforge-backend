"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function Point(x, y) { this.x = x; this.y = y; }
Point.prototype.dist = function () { return Math.hypot(this.x, this.y); };
function Box(side) { this.side = side; return { side, kind: "box" }; }   // returns an object: replaces the instance
function Prim(n) { this.n = n; return n * 2; }                          // returns a primitive: ignored
const ctors = { Point, Box, Prim };
function construct(F, ...args) {
  const obj = Object.create(F.prototype);          // 1. a fresh object linked to F.prototype
  const result = F.apply(obj, args);               // 2. run F with this = obj
  const isObject = result !== null && (typeof result === "object" || typeof result === "function");
  return isObject ? result : obj;                  // 3./4. an object result wins, anything else gives obj
}
for (const line of lines) {
  const [name, ...args] = line.trim().split(/\s+/);
  const F = ctors[name];
  const made = construct(F, ...args.map(Number));
  const real = new F(...args.map(Number));
  const proto = Object.getPrototypeOf(made) === F.prototype ? name : Object.getPrototypeOf(made).constructor.name;
  console.log(`${name}(${args.join(",")}): ${JSON.stringify(made)} proto=${proto} instanceof=${made instanceof F} matchesNew=${JSON.stringify(made) === JSON.stringify(real) && Object.getPrototypeOf(made) === Object.getPrototypeOf(real)}`);
}
