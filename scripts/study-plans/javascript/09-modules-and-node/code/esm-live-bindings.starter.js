"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const n = Number(lines[0]);
const url = "data:text/javascript,export let count = 0; export function inc() { count++; } export default 'the default';";
async function main() {
  // TODO: import the module (twice), call inc n times, report the live binding, identity, namespace keys, and the CJS side
}
main();
