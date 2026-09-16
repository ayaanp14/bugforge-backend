"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
function makeCounter() {
  let value = 0;
  const history = [];
  return {
    inc: (by = 1) => { value += by; history.push(`+${by}`); },
    dec: (by = 1) => { value -= by; history.push(`-${by}`); },
    undo: () => {
      const last = history.pop();
      if (last === undefined) return "nothing to undo";
      value -= Number(last);
      return `undid ${last}`;
    },
    get: () => value,
    log: () => (history.length ? history.join(" ") : "(empty)"),
  };
}
let pos = 0;
const next = () => tokens[pos++];
const n = Number(next());
const c = makeCounter();
for (let i = 0; i < n; i++) {
  const cmd = next();
  if (cmd === "inc") c.inc(Number(next()));
  else if (cmd === "dec") c.dec(Number(next()));
  else if (cmd === "undo") console.log(c.undo());
  else if (cmd === "get") console.log(`value=${c.get()}`);
  else console.log(`log=${c.log()}`);
}
