"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Account {
  static count = 0;
  #balance = 0;
  history = [];
  constructor(name, opening) {
    this.name = name;
    this.#balance = opening;
    Account.count++;
  }
  deposit(amount) {
    if (amount <= 0) throw new RangeError("amount must be positive");
    this.#balance += amount;
    this.history.push(["deposit", amount]);
    return this;
  }
  withdraw(amount) {
    if (amount <= 0) throw new RangeError("amount must be positive");
    if (amount > this.#balance) throw new RangeError(`insufficient funds in ${this.name}`);
    this.#balance -= amount;
    this.history.push(["withdraw", amount]);
    return this;
  }
  get balance() { return this.#balance; }
  toString() { return `${this.name}: ${this.#balance} (${this.history.length} transactions)`; }
}
const accounts = new Map();
for (const line of lines) {
  const [cmd, name, amount] = line.trim().split(/\s+/);
  try {
    if (cmd === "open") accounts.set(name, new Account(name, Number(amount)));
    else if (cmd === "deposit") accounts.get(name).deposit(Number(amount));
    else if (cmd === "withdraw") accounts.get(name).withdraw(Number(amount));
    else if (cmd === "show") console.log(String(accounts.get(name)));
    else if (cmd === "count") console.log(`accounts=${Account.count}`);
  } catch (e) {
    console.log(`error: ${e.message}`);
  }
}
