"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function parseJson(text) {
  // TODO: { ok: true, value } or { ok: false, error: "parse failed (SyntaxError)" } — never throw
}
function getPath(obj, path) {
  // TODO: walk a.b.c with Object.hasOwn; { ok, value } or { ok: false, error: `missing 'k' at <prefix>` }
}
const parsed = parseJson(lines[0]);
// TODO
