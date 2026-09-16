"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
class Money {
  constructor(cents, currency = "USD") { this.cents = cents; this.currency = currency; }
  // TODO: valueOf, toString, toJSON, get [Symbol.toStringTag]
}
const amounts = tokens.map(Number).map((c) => new Money(c));
// TODO
