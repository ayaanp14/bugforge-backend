"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Account {
  static count = 0;
  #balance = 0;
  history = [];
  constructor(name, opening) {
    // TODO
  }
  // TODO: deposit, withdraw, get balance
}
const accounts = new Map();
for (const line of lines) {
  const [cmd, name, amount] = line.trim().split(/\s+/);
  // TODO: open | deposit | withdraw | show | count
}
