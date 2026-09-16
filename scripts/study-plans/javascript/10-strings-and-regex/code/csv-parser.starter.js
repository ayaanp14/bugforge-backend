"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function parseCsvLine(line) {
  // TODO: RFC 4180 fields: commas, quotes, doubled quotes; throw SyntaxError on an unterminated quote
}
for (const line of lines) {
  // TODO print JSON of the fields, or `error: <message>`
}
