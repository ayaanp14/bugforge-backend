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
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
async function retry(fn, { attempts, isTransient }) {
  for (let i = 1; ; i++) {
    try { return await fn(i); }
    catch (err) {
      if (i >= attempts || !isTransient(err)) throw new Error(`gave up after ${i} attempts`, { cause: err });
      await sleep(2 ** (i - 1));
    }
  }
}
async function main() {
  const [attempts, timeoutMs] = lines[0].trim().split(/\s+/).map(Number);
  const specs = lines.slice(1).map((l) => { const [url, ms, failures] = l.trim().split(/\s+/); return { url, ms: Number(ms), failures: Number(failures) }; });
  const outcomes = await Promise.allSettled(specs.map((spec) =>
    retry(() => withTimeout(fakeFetch(spec), timeoutMs), { attempts, isTransient: (e) => e instanceof TransientError })
  ));
  outcomes.forEach((o, i) => {
    const spec = specs[i];
    if (o.status === "fulfilled") console.log(`${spec.url}: ok after ${attemptsSeen.get(spec.url)} attempt(s)`);
    else console.log(`${spec.url}: failed - ${o.reason.message} <- ${o.reason.cause.name}: ${o.reason.cause.message}`);
  });
  console.log(`summary: ok=${outcomes.filter((o) => o.status === "fulfilled").length} failed=${outcomes.filter((o) => o.status === "rejected").length}`);
}
main();
