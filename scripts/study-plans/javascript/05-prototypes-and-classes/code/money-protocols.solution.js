"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
class Money {
  constructor(cents, currency = "USD") { this.cents = cents; this.currency = currency; }
  valueOf() { return this.cents; }
  toString() { return `${(this.cents / 100).toFixed(2)} ${this.currency}`; }
  toJSON() { return { amount: this.cents / 100, currency: this.currency }; }
  get [Symbol.toStringTag]() { return "Money"; }
}
const amounts = tokens.map(Number).map((c) => new Money(c));
const [a, b] = amounts;
console.log(`template=${a} string=${String(b)}`);
console.log(`plus=${a + 1} minus=${a - b} greater=${a > b}`);
console.log(`sorted=${[...amounts].sort((x, y) => x - y).map(String).join(" | ")}`);
console.log(`json=${JSON.stringify(amounts)}`);
console.log(`tag=${Object.prototype.toString.call(a)} total=${amounts.reduce((s, m) => s + m, 0)}`);
