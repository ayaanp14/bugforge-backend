"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const schema = JSON.parse(lines[0]);      // { "name": "string", "email?": "string", "tags": "string[]" }
function check(value, schema, { fresh }) {
  // TODO: missing required properties, wrong types, and — for a fresh literal only — excess properties
}
for (const line of lines.slice(1)) {
  const [mode, ...rest] = line.trim().split(/\s+/);
  // TODO: `fresh <json>` | `var <json>` → `ok` or `not assignable — <problems joined by ; >`
}
