"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Line 1: `cards: a b c …` (all start in box 1). Then `session <n>: a=ok b=miss …`.
// Box 1 is due every session, box 2 every 2nd, box 3 every 4th; box 4 is mastered (retired). ok moves a due card up one box; miss sends it back to box 1.
const box = new Map(lines[0].replace(/^cards:\s*/, "").trim().split(/\s+/).map((c) => [c, 1]));
const INTERVAL = { 1: 1, 2: 2, 3: 4 };
const dueIn = (session) => [...box].filter(([, b]) => b < 4 && session % INTERVAL[b] === 0).map(([c]) => c);
const boxes = () => [...box].map(([c, b]) => `${c}=${b === 4 ? "M" : b}`).join(" ");
let last = 0;
for (const line of lines.slice(1)) {
  const [, n, rest] = line.match(/^session (\d+):\s*(.*)$/);
  const session = Number(n);
  last = session;
  const due = dueIn(session);
  const results = Object.fromEntries((rest.trim() ? rest.trim().split(/\s+/) : []).map((kv) => kv.split("=")));
  const ok = [], miss = [], ignored = [], skipped = [];
  for (const card of due) {
    if (results[card] === "ok") { box.set(card, box.get(card) + 1); ok.push(card); }
    else if (results[card] === "miss") { box.set(card, 1); miss.push(card); }
    else skipped.push(card);                                                   // due but not reviewed: stays where it is
  }
  for (const card of Object.keys(results)) if (!due.includes(card)) ignored.push(card);   // not due: a review does not count
  console.log(`session ${session}: due=[${due.join(",")}] ok=[${ok.join(",")}] miss=[${miss.join(",")}]${skipped.length ? ` skipped=[${skipped.join(",")}]` : ""}${ignored.length ? ` ignored=[${ignored.join(",")}]` : ""} -> ${boxes()}`);
}
const byBox = (b) => [...box].filter(([, v]) => v === b).map(([c]) => c).join(",") || "-";
console.log(`mastered: ${byBox(4)} | box3: ${byBox(3)} | box2: ${byBox(2)} | box1: ${byBox(1)}`);
console.log(`next due (session ${last + 1}): [${dueIn(last + 1).join(",")}]`);
