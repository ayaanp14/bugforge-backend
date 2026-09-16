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
let imported = 0, skipped = 0, seen = 0;
try {
  for (const line of lines) {
    const [kind, id, ...rest] = line.trim().split(/\s+/);
    seen++;
    try {
      importRecord(kind, id, rest.join(" "));
      imported++;
      console.log(`imported ${id}`);
    } catch (err) {
      if (!(err instanceof ValidationError)) throw err;   // not an expected failure: let the batch boundary see it
      skipped++;
      console.log(`skipped ${err.id}: ${err.message}`);
    }
  }
  console.log(`done: imported=${imported} skipped=${skipped}`);
} catch (err) {
  console.log(`fatal: ${err.name}: ${err.message} - batch aborted after ${seen} records (imported=${imported} skipped=${skipped})`);
}
