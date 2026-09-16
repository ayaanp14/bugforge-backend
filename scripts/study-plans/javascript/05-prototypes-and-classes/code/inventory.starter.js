"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Item {
  // TODO: name, price, qty; get value(); toJSON()
}
class PerishableItem extends Item {
  // TODO: expiresDay; isExpired(day); describe adds [expired]
}
class Inventory {
  #items = new Map();
  // TODO: add(item), remove(name), report(day), toJSON()
}
const inv = new Inventory();
for (const line of lines) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  // TODO: item | perishable | remove | report <day> | json
}
