"use strict";
const input = require("fs").readFileSync(0, "utf8");
const { Readable, Transform, Writable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"];
async function main() {
  const [minLevel, ...raw] = input.split("\n").filter((l) => l.trim() !== "");
  let seen = 0, malformed = 0;
  const parse = new Transform({
    readableObjectMode: true,
    transform(chunk, _enc, cb) {
      seen++;
      const m = /^(\S+)\s+(DEBUG|INFO|WARN|ERROR)\s+(.*)$/.exec(chunk.toString().trim());
      if (!m) { malformed++; return cb(); }          // drop, but keep going
      cb(null, { time: m[1], level: m[2], message: m[3] });
    },
  });
  const filter = new Transform({ objectMode: true, transform(rec, _enc, cb) { if (LEVELS.indexOf(rec.level) >= LEVELS.indexOf(minLevel)) this.push(rec); cb(); } });
  const counts = new Map(), byHour = new Map();
  let firstError = null, kept = 0;
  const summarise = new Writable({
    objectMode: true,
    write(rec, _enc, cb) {
      kept++;
      counts.set(rec.level, (counts.get(rec.level) ?? 0) + 1);
      const hour = rec.time.slice(11, 13);
      byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
      if (rec.level === "ERROR" && firstError === null) firstError = `${rec.time} ${rec.message}`;
      cb();
    },
  });
  await pipeline(Readable.from(raw), parse, filter, summarise);
  console.log(`seen=${seen} malformed=${malformed} kept=${kept}`);
  console.log(`levels: ${LEVELS.filter((l) => counts.has(l)).map((l) => `${l}=${counts.get(l)}`).join(" ") || "none"}`);
  console.log(`byHour: ${[...byHour].sort(([a], [b]) => a.localeCompare(b)).map(([h, n]) => `${h}h=${n}`).join(" ") || "none"}`);
  console.log(`firstError: ${firstError ?? "none"}`);
}
main();
