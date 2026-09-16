"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Shape {
  constructor(name) { this.name = name; }
  area() { return 0; }
  perimeter() { return 0; }
  describe() { return `${this.name}: area=${this.area().toFixed(2)} perimeter=${this.perimeter().toFixed(2)}`; }
}
class Circle extends Shape {
  constructor(r) { super("circle"); this.r = r; }
  area() { return Math.PI * this.r ** 2; }
  perimeter() { return 2 * Math.PI * this.r; }
  describe() { return `${super.describe()} r=${this.r}`; }
}
class Rect extends Shape {
  constructor(w, h, name = "rect") { super(name); this.w = w; this.h = h; }
  area() { return this.w * this.h; }
  perimeter() { return 2 * (this.w + this.h); }
  describe() { return `${super.describe()} ${this.w}x${this.h}`; }
}
class Square extends Rect {
  constructor(s) { super(s, s, "square"); }
}
const shapes = [];
for (const line of lines) {
  const [kind, ...nums] = line.trim().split(/\s+/);
  const [a, b] = nums.map(Number);
  if (kind === "circle") shapes.push(new Circle(a));
  else if (kind === "rect") shapes.push(new Rect(a, b));
  else if (kind === "square") shapes.push(new Square(a));
}
for (const s of shapes) console.log(s.describe());
const total = shapes.reduce((sum, s) => sum + s.area(), 0);
console.log(`total area=${total.toFixed(2)} shapes=${shapes.length} rects=${shapes.filter((s) => s instanceof Rect).length} squares=${shapes.filter((s) => s instanceof Square).length}`);
const chain = [];
for (let p = Object.getPrototypeOf(new Square(1)); p !== null; p = Object.getPrototypeOf(p)) chain.push(p.constructor.name);
console.log(`chain=${chain.join(" -> ")}`);
