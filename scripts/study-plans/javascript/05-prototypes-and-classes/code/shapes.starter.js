"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Shape {
  constructor(name) { this.name = name; }
  area() { return 0; }
  perimeter() { return 0; }
  describe() { return `${this.name}: area=${this.area().toFixed(2)} perimeter=${this.perimeter().toFixed(2)}`; }
}
// TODO: Circle(r), Rect(w, h), Square(s) extends Rect — override area/perimeter, extend describe with super
const shapes = [];
// TODO: parse lines, print describe() per shape, then the totals and the chain
