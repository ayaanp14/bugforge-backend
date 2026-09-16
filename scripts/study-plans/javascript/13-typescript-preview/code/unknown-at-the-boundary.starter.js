"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function assertNever(x) { throw new Error(`unhandled value: ${JSON.stringify(x)}`); }
function handle(data /* : unknown */) {
  // TODO: narrow step by step and return a description; objects with a kind dispatch on it (circle | square) with assertNever in the default
}
for (const line of lines) {
  // TODO: JSON.parse → unknown → handle; print `narrowed to <type>: <summary>` or `error: <message>`
}
