"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const [head, ...frames] = lines;
const colon = head.indexOf(": ");
console.log(`error=${head.slice(0, colon)}`);
console.log(`message=${head.slice(colon + 2)}`);
console.log(`frames=${frames.length}`);
let user = "none";
for (const frame of frames) {
  const m = frame.match(/\(?([^\s()]+):(\d+):\d+\)?\s*$/);
  if (m && !m[1].startsWith("node:")) {
    user = `${m[1]}:${m[2]}`;
    break;
  }
}
console.log(`user=${user}`);
