"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const parse = (v) => v.split(".").map(Number);   // [major, minor, patch]
const cmp = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
function satisfies(version, range) {
  // TODO: exact | ^ | ~ | >=, >, <=, < | 1.x / 1.2.x / * | space-separated AND
}
for (const line of lines) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  // TODO: `check <version> <range...>` | `max <range> <versions...>`
}
