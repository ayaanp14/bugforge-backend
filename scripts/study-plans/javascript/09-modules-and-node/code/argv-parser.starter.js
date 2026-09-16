"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function parseArgs(argv) {
  // TODO: --key=value | --key value | --flag | --no-flag | -abc | -- | positionals
}
console.log(JSON.stringify(parseArgs(lines[0].trim().split(/\s+/))));
