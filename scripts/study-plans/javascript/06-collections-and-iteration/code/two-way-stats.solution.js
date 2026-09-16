"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function* stats() {
  let count = 0, sum = 0, min = Infinity, max = -Infinity;
  let x = yield null;                       // the priming next() stops here; its argument is dropped
  while (true) {
    count++; sum += x; min = Math.min(min, x); max = Math.max(max, x);
    x = yield { count, sum, min, max, avg: sum / count };
  }
}
const gen = stats();
gen.next();   // prime: run to the first yield
let last = null;
for (const line of lines) {
  const [cmd, value] = line.trim().split(/\s+/);
  if (cmd === "add") {
    const r = gen.next(Number(value));
    if (r.done) { console.log(`add ${value} ignored: generator finished`); continue; }
    last = r.value;
    console.log(`count=${last.count} sum=${last.sum} min=${last.min} max=${last.max} avg=${last.avg.toFixed(2)}`);
  } else if (cmd === "done") {
    const r = gen.return(last);
    console.log(`done=${r.done} final=${last ? `${last.count} values, avg ${last.avg.toFixed(2)}` : "nothing"} afterwards=${JSON.stringify(gen.next(1))}`);
  }
}
