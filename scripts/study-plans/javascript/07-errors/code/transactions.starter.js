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
// TODO: AccountNotFound (E_NOT_FOUND), InvalidAmount (E_INVALID_AMOUNT), InsufficientFunds (E_INSUFFICIENT)
const accounts = new Map();
const errorCounts = new Map();
for (const line of lines) {
  const [cmd, a, b, c] = line.trim().split(/\s+/);
  // TODO: open a amount | deposit a amount | withdraw a amount | transfer a b amount | show
}
