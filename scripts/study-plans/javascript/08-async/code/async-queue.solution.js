"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class AsyncQueue {
  #items = [];
  #waiting = [];     // resolvers of consumers blocked in take()
  put(value) {
    if (this.#waiting.length) this.#waiting.shift()(value);   // hand it straight to the oldest waiter
    else this.#items.push(value);
  }
  take() {
    if (this.#items.length) return Promise.resolve(this.#items.shift());
    return new Promise((resolve) => this.#waiting.push(resolve));
  }
  get size() { return this.#items.length; }
  get waiting() { return this.#waiting.length; }
}
async function main() {
  const q = new AsyncQueue();
  for (const line of lines) {
    const [cmd, arg] = line.trim().split(/\s+/);
    if (cmd === "take") q.take().then((v) => console.log(`${arg} got ${v}`));
    else if (cmd === "put") q.put(arg);
    else if (cmd === "status") console.log(`size=${q.size} waiting=${q.waiting}`);
    await null;                    // let the microtasks (the then callbacks) run before the next command
  }
}
main();
