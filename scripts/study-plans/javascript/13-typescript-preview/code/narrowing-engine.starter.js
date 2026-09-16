"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Union members: string number boolean null undefined Date string[] {kind:"a"} {kind:"b"}
const members = lines[0].trim().split(/\s+/);
function describe(m) {
  // TODO: { typeof, isNull, isDate, isArray, kind, canBeFalsy } for each member token
}
function narrow(members, check) {
  // TODO: return { yes: [...], no: [...] } for: typeof <t> | instanceof Date | === null | truthy | Array.isArray | in kind | kind === <v>
}
const show = (ms) => ms.join(" | ") || "never";
for (const line of lines.slice(1)) console.log(`${line.trim()} -> true: ${show(narrow(members, line.trim()).yes)} | false: ${show(narrow(members, line.trim()).no)}`);
