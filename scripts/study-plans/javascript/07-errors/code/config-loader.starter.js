"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class ConfigError extends Error { constructor(message, options) { super(message, options); this.name = "ConfigError"; } }
function loadConfig(text) {
  // TODO: parse (wrap SyntaxError), validate host (TypeError), port (RangeError), retries (default 3, TypeError) — each wrapped in ConfigError with cause
}
function describe(err) {
  // TODO: chain `Name: message <- Name: message`; SyntaxError shows the name only (its message differs between engines)
}
for (const line of lines) {
  // TODO
}
