"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const ada = { name: "Ada", who() { return this === undefined ? "undefined" : this.name; }, viaArrow() { return [1].map(() => this.name)[0]; } };
const bo = { name: "Bo" };
function Thing(name) { this.name = name; }
const n = Number(tokens[0]);
for (let i = 1; i <= n; i++) {
  const kind = tokens[i];
  let result;
  switch (kind) {
    case "method": result = ada.who(); break;                       // receiver of the dot
    case "detached": { const f = ada.who; result = f(); break; }    // plain call: this is undefined
    case "bound": result = ada.who.bind(bo)(); break;                // explicit binding
    case "call": result = ada.who.call({ name: "Cy" }); break;
    case "arrow-in-method": result = ada.viaArrow(); break;          // arrow borrows the method's this
    default: result = new Thing("instance").name;                    // new: a fresh object
  }
  console.log(`${kind}: ${result}`);
}
