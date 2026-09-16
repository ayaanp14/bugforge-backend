"use strict";
const input = require("fs").readFileSync(0, "utf8");
const { Readable, Transform, Writable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const readline = require("node:readline");
const LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"];
async function main() {
  const [minLevel, ...logLines] = input.split("\n").filter((l) => l.trim() !== "");
  const parse = new Transform({
    readableObjectMode: true,                       // bytes/strings in, records out
    transform(chunk, _enc, cb) {
      const text = chunk.toString().trim();
      if (text === "BAD") return cb(new Error("corrupt line"));
      const [level, ...rest] = text.split(/\s+/);
      cb(null, { level, message: rest.join(" ") });
    },
  });
  const atLeast = (min) => new Transform({
    objectMode: true,
    transform(rec, _enc, cb) { if (LEVELS.indexOf(rec.level) >= LEVELS.indexOf(min)) this.push(rec); cb(); },
  });
  const kept = [];
  const collect = new Writable({ objectMode: true, write(rec, _enc, cb) { kept.push(rec); cb(); } });
  const good = logLines.filter((l) => l.trim() !== "BAD");
  await pipeline(Readable.from(good), parse, atLeast(minLevel), collect);
  console.log(`kept ${kept.length} of ${good.length}: ${kept.map((r) => `${r.level}:${r.message}`).join(" | ")}`);
  const counts = kept.reduce((m, r) => m.set(r.level, (m.get(r.level) ?? 0) + 1), new Map());
  console.log(`counts: ${LEVELS.filter((l) => counts.has(l)).map((l) => `${l}=${counts.get(l)}`).join(" ")}`);
  if (good.length !== logLines.length) {
    const parse2 = new Transform({ readableObjectMode: true, transform(chunk, _enc, cb) { const t = chunk.toString().trim(); t === "BAD" ? cb(new Error("corrupt line")) : cb(null, { t }); } });
    const sink = new Writable({ objectMode: true, write(_r, _e, cb) { cb(); } });
    await pipeline(Readable.from(logLines), parse2, sink).then(
      () => console.log("pipeline with BAD: completed"),
      (err) => console.log(`pipeline with BAD: failed - ${err.message}; sinkDestroyed=${sink.destroyed}`),
    );
  }
  let count = 0;
  for await (const line of readline.createInterface({ input: Readable.from([input]) })) if (line.trim()) count++;
  console.log(`readline lines=${count}`);
}
main();
