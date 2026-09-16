"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const timers = require("timers/promises");
async function main() {
  const n = Number(lines[0]);
  // TODO: setInterval every 5 ms, n ticks, clearInterval, resolve a promise when done
  // TODO: await timers.setTimeout(5, "value"); abort a long sleep with AbortController
}
main();
