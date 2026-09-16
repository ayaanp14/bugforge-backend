"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class AppError extends Error {
  constructor(message, { code, cause, ...extra } = {}) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.code = code;
    Object.assign(this, extra);
  }
}
class AccountNotFound extends AppError { constructor(id) { super(`account ${id} not found`, { code: "E_NOT_FOUND" }); } }
class InvalidAmount extends AppError { constructor(amount) { super(`invalid amount ${amount}`, { code: "E_INVALID_AMOUNT" }); } }
class InsufficientFunds extends AppError { constructor(id, need, have) { super(`${id} has ${have}, needs ${need}`, { code: "E_INSUFFICIENT" }); } }
const accounts = new Map();
const errorCounts = new Map();
function account(id) {
  if (!accounts.has(id)) throw new AccountNotFound(id);
  return accounts.get(id);
}
function amountOf(text) {
  const n = Number(text);
  if (!Number.isFinite(n) || n <= 0) throw new InvalidAmount(text);
  return n;
}
function withdraw(id, amount) {
  const acc = account(id);
  if (acc.balance < amount) throw new InsufficientFunds(id, amount, acc.balance);
  acc.balance -= amount;
}
function transfer(from, to, amount) {
  const src = account(from), dst = account(to);       // validate everything before touching state
  if (src.balance < amount) throw new InsufficientFunds(from, amount, src.balance);
  src.balance -= amount;
  dst.balance += amount;
}
for (const line of lines) {
  const [cmd, a, b, c] = line.trim().split(/\s+/);
  try {
    if (cmd === "open") accounts.set(a, { balance: amountOf(b) });
    else if (cmd === "deposit") account(a).balance += amountOf(b);
    else if (cmd === "withdraw") withdraw(a, amountOf(b));
    else if (cmd === "transfer") transfer(a, b, amountOf(c));
    else if (cmd === "show") console.log(`balances: ${[...accounts].map(([id, acc]) => `${id}=${acc.balance}`).join(" ")}`);
  } catch (err) {
    if (!(err instanceof AppError)) throw err;
    errorCounts.set(err.code, (errorCounts.get(err.code) ?? 0) + 1);
    console.log(`${err.code}: ${err.message}`);
  }
}
console.log(`errors: ${[...errorCounts].sort(([x], [y]) => x.localeCompare(y)).map(([code, n]) => `${code}=${n}`).join(" ") || "none"}`);
