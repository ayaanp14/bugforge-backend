"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Item {
  constructor(name, price, qty) { this.name = name; this.price = price; this.qty = qty; }
  get value() { return this.price * this.qty; }
  isExpired() { return false; }
  describe(day) { return `${this.name} x${this.qty} @ ${this.price.toFixed(2)} = ${this.value.toFixed(2)}${this.isExpired(day) ? " [expired]" : ""}`; }
  toJSON() { return { name: this.name, price: this.price, qty: this.qty }; }
}
class PerishableItem extends Item {
  constructor(name, price, qty, expiresDay) { super(name, price, qty); this.expiresDay = expiresDay; }
  isExpired(day) { return day > this.expiresDay; }
  toJSON() { return { ...super.toJSON(), expiresDay: this.expiresDay }; }
}
class Inventory {
  #items = new Map();
  add(item) { this.#items.set(item.name, item); return this; }
  remove(name) { return this.#items.delete(name); }
  get size() { return this.#items.size; }
  report(day) {
    const items = [...this.#items.values()].sort((a, b) => a.name.localeCompare(b.name));
    for (const it of items) console.log(it.describe(day));
    const total = items.filter((it) => !it.isExpired(day)).reduce((s, it) => s + it.value, 0);
    console.log(`total=${total.toFixed(2)} items=${items.length} expired=${items.filter((it) => it.isExpired(day)).length}`);
  }
  toJSON() { return [...this.#items.values()]; }
}
const inv = new Inventory();
for (const line of lines) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  if (cmd === "item") inv.add(new Item(args[0], Number(args[1]), Number(args[2])));
  else if (cmd === "perishable") inv.add(new PerishableItem(args[0], Number(args[1]), Number(args[2]), Number(args[3])));
  else if (cmd === "remove") console.log(`removed ${args[0]}=${inv.remove(args[0])}`);
  else if (cmd === "report") inv.report(Number(args[0]));
  else if (cmd === "json") console.log(JSON.stringify(inv));
}
