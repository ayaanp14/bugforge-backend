"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function assertNever(x) { throw new Error(`unhandled variant: ${JSON.stringify(x)}`); }
function area(shape) {
  // TODO: switch on shape.kind — circle(r) | rect(w, h) | square(s); default: assertNever
}
function render(state) {
  // TODO: switch on state.status — loading | error(error) | ready(data)
}
for (const line of lines) {
  // TODO: objects with kind → area; objects with status → render; print or `error: <message>`
}
