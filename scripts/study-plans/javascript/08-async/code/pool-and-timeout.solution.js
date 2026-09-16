"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return results;
}
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
async function main() {
  const limit = Number(lines[0]);
  const items = [];
  let timeoutSpec = null;
  for (const line of lines.slice(1)) {
    const [a, b, c] = line.trim().split(/\s+/);
    if (a === "timeout") timeoutSpec = { taskMs: Number(b), limitMs: Number(c) };
    else items.push({ name: a, ms: Number(b) });
  }
  let running = 0, maxConcurrent = 0;
  const completed = [];
  const results = await mapLimit(items, limit, async (item) => {
    running++;
    maxConcurrent = Math.max(maxConcurrent, running);
    await sleep(item.ms);
    running--;
    completed.push(item.name);
    return item.name.toUpperCase();
  });
  console.log(`results=${results.join(",")} completed=${completed.join(",")} maxConcurrent=${maxConcurrent}`);
  if (timeoutSpec) {
    await withTimeout(sleep(timeoutSpec.taskMs, "finished"), timeoutSpec.limitMs).then(
      (v) => console.log(`timeout: ${v}`),
      (err) => console.log(`timeout: ${err.message}`),
    );
  }
}
main();
