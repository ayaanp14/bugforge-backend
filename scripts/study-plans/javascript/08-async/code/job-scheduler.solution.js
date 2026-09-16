"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const jobs = new Map(lines.map((l) => {
  const [name, ms, deps] = l.trim().split(/\s+/);
  return [name, { name, ms: Number(ms), deps: deps === "-" ? [] : deps.split(",") }];
}));
const running = new Map();     // name -> promise of { finish }
const order = [];
function promiseFor(name) {
  if (!running.has(name)) {
    const job = jobs.get(name);
    running.set(name, (async () => {
      const finished = await Promise.all(job.deps.map(promiseFor));     // wait for every prerequisite
      const startAt = finished.reduce((m, f) => Math.max(m, f.finish), 0);
      await sleep(job.ms);
      order.push(name);
      return { finish: startAt + job.ms };                             // virtual clock along the critical path
    })());
  }
  return running.get(name);
}
Promise.all([...jobs.keys()].map(promiseFor)).then((results) => {
  console.log(`order: ${order.join(" ")}`);
  console.log(`finish: ${[...jobs.keys()].map((n, i) => `${n}=${results[i].finish}`).join(" ")}`);
  console.log(`makespan=${Math.max(...results.map((r) => r.finish))}`);
});
