"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const assert = require("node:assert/strict");
function validateUser(u) {
  // TODO: collect every problem; throw one Error listing them; return the normalised record
}
for (const line of lines) {
  // TODO: `assert <a> <b>` lines run assert.equal(Number(a), Number(b)); other lines are JSON users
}
