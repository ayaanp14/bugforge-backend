"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class DefaultMap extends Map {
  constructor(makeDefault) { super(); this.makeDefault = makeDefault; }
  get(key) {
    if (!this.has(key)) this.set(key, this.makeDefault());
    return super.get(key);
  }
}
class Stack extends Array {
  peek() { return this[this.length - 1]; }
}
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
const words = lines[0].trim().split(/\s+/);
const numbers = lines[1].trim().split(/\s+/).map(Number);
const [status, ...msg] = lines[2].trim().split(/\s+/);
const counts = new DefaultMap(() => 0);
for (const w of words) counts.set(w, counts.get(w) + 1);
console.log(`counts: ${[...counts].sort(([a], [b]) => a.localeCompare(b)).map(([w, n]) => `${w}=${n}`).join(" ")} instanceofMap=${counts instanceof Map}`);
const stack = Stack.from(numbers);
const doubled = stack.map((x) => x * 2);
console.log(`stack: peek=${stack.peek()} length=${stack.length} isArray=${Array.isArray(stack)} mapKeepsClass=${doubled instanceof Stack} doubledPeek=${doubled.peek()}`);
try {
  throw new HttpError(Number(status), msg.join(" "));
} catch (e) {
  console.log(`${e.name} ${e.status}: ${e.message} instanceofError=${e instanceof Error} stackStartsWithName=${e.stack.startsWith("HttpError")}`);
}
