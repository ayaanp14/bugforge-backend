"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const tasks = lines.map((l) => { const [name, ms] = l.trim().split(/\s+/); return { name, ms: Number(ms) }; });
async function main() {
  const sequential = [];
  for (const t of tasks) {
    await sleep(t.ms);
    sequential.push(t.name);          // one at a time, in input order
  }
  const parallel = [];
  await Promise.all(tasks.map(async (t) => {
    await sleep(t.ms);
    parallel.push(t.name);            // all started together: finishes in duration order
  }));
  console.log(`sequential: ${sequential.join(" ")}`);
  console.log(`parallel: ${parallel.join(" ")}`);
  const total = tasks.reduce((s, t) => s + t.ms, 0);
  const longest = tasks.reduce((m, t) => Math.max(m, t.ms), 0);
  console.log(`sequentialTime=${total} parallelTime=${longest}`);
}
main();
