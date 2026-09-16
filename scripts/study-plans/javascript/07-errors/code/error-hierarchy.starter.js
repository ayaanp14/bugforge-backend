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
// TODO: ValidationError(field, message) -> code E_VALIDATION, field; NotFoundError(what, id) -> code E_NOT_FOUND, status 404
function describe(err) {
  // TODO: walk err.cause: `Name: message <- Name: message`
}
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  // TODO: validate <field> <value|-> | find <what> <id> | wrap <message>
}
