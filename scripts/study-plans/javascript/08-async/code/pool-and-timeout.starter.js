"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
async function mapLimit(items, limit, worker) {
  // TODO: at most `limit` workers running; results by index
}
function withTimeout(promise, ms) {
  // TODO: race against a timer; clear the timer in finally
}
async function main() {
  // TODO
}
main();
