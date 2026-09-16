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
class ValidationError extends AppError {
  constructor(field, message) { super(message, { code: "E_VALIDATION", field }); }
}
class NotFoundError extends AppError {
  constructor(what, id) { super(`${what} ${id} not found`, { code: "E_NOT_FOUND", status: 404 }); }
}
function describe(err) {
  const parts = [];
  for (let e = err; e; e = e.cause) parts.push(`${e.name}: ${e.message}`);
  return parts.join(" <- ");
}
for (const line of lines) {
  const [cmd, a, ...rest] = line.trim().split(/\s+/);
  const b = rest[0];
  try {
    if (cmd === "validate") {
      if (b === "-") throw new ValidationError(a, `${a} is required`);
      console.log(`valid ${a}=${b}`);
    } else if (cmd === "find") {
      if (b.endsWith("0")) throw new NotFoundError(a, b);
      console.log(`found ${a} ${b}`);
    } else if (cmd === "wrap") {
      try { throw new RangeError("inner value out of range"); }
      catch (inner) { throw new AppError([a, ...rest].join(" "), { code: "E_WRAP", cause: inner }); }
    }
  } catch (err) {
    console.log(`${err.name} [${err.code}] ${err.message} field=${err.field ?? "-"} status=${err.status ?? "-"} isAppError=${err instanceof AppError} chain=${describe(err)}`);
  }
}
