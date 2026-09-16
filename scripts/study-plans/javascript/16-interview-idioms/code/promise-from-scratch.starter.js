"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Implement MyPromise: one-shot settlement, then/catch/finally returning new promises, handlers always asynchronous (queueMicrotask),
// adoption of thenables (returned from handlers and passed to resolve), and the statics resolve/reject/all/allSettled/race/any.
// Input: scenario names — chain adopt reject order all allSettled race any
class MyPromise {
  // TODO
}
