"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const timers = require("timers/promises");
function ticks(n, everyMs) {
  return new Promise((resolve) => {
    let count = 0;
    const id = setInterval(() => {
      count++;
      console.log(`tick ${count}`);
      if (count === n) { clearInterval(id); resolve(count); }   // forgetting this keeps the process alive forever
    }, everyMs);
  });
}
async function main() {
  const n = Number(lines[0]);
  const total = await ticks(n, 5);
  console.log(`interval done after ${total} ticks`);
  const v = await timers.setTimeout(5, "value");
  console.log(`promise timer resolved with ${v}`);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5);
  try {
    await timers.setTimeout(1000, undefined, { signal: controller.signal });
    console.log("long sleep finished");
  } catch (err) {
    console.log(`long sleep aborted: ${err.name} aborted=${controller.signal.aborted}`);
  }
  const keepAlive = setInterval(() => {}, 1000);
  keepAlive.unref();                    // this interval will not hold the process open
  console.log("unref: process may exit");
}
main();
