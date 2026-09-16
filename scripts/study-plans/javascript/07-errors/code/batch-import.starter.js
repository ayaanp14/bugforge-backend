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
class ValidationError extends AppError { constructor(id, reason) { super(`${id}: ${reason}`, { code: "E_VALIDATION", id }); } }
function importRecord(kind, id, reason) {
  if (kind === "invalid") throw new ValidationError(id, reason);
  if (kind === "crash") throw new TypeError(`unexpected null record at ${id}`);   // a bug, not a validation failure
  return id;
}
// TODO: per-item recovery for ValidationError only; anything else aborts the batch
