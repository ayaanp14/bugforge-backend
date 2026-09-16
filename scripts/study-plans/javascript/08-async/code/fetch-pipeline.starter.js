"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
class TransientError extends Error { constructor(m) { super(m); this.name = "TransientError"; } }
const attemptsSeen = new Map();
function fakeFetch(spec) {
  const n = (attemptsSeen.get(spec.url) ?? 0) + 1;
  attemptsSeen.set(spec.url, n);
  return sleep(spec.ms).then(() => {
    if (n <= spec.failures) throw new TransientError(`${spec.url} attempt ${n} failed`);
    return `${spec.url} body`;
  });
}
// TODO: withTimeout, retry with backoff (1 ms * 2^(i-1)), allSettled over all urls, per-url report
