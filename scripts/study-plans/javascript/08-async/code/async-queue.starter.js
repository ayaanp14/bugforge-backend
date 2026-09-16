"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class AsyncQueue {
  #items = [];
  #waiting = [];     // resolvers of consumers blocked in take()
  // TODO: put(value), take() -> Promise, get size, get waiting
}
async function main() {
  const q = new AsyncQueue();
  for (const line of lines) {
    const [cmd, arg] = line.trim().split(/\s+/);
    // TODO: take <consumer> | put <value> | status ; await a microtask after each command so prints are in order
  }
}
main();
