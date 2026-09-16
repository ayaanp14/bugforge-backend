"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [header, ...frameLines] = input.split("\n").filter((l) => l.trim() !== "");
const frames = frameLines.map((l) => {
  const m = /^\s*at (?:(.+?) \((.+):(\d+):(\d+)\)|(.+):(\d+):(\d+)|(.+?) \((<anonymous>)\))$/.exec(l);
  if (!m) return null;
  if (m[1] !== undefined) return { fn: m[1], file: m[2], line: Number(m[3]), col: Number(m[4]) };
  if (m[5] !== undefined) return { fn: "<anonymous>", file: m[5], line: Number(m[6]), col: Number(m[7]) };
  return { fn: m[8], file: m[9], line: 0, col: 0 };
}).filter(Boolean);
const [, name, message] = /^(\w+): (.*)$/.exec(header.trim()) ?? [null, "Error", header.trim()];
console.log(`error: ${name} - ${message}`);
console.log(`frames=${frames.length} top=${frames[0].fn}@${frames[0].file}:${frames[0].line}:${frames[0].col}`);
const own = frames.find((f) => !f.file.startsWith("node:") && f.file !== "<anonymous>");
console.log(own ? `yours=${own.fn} ${own.file}:${own.line} col ${own.col}` : "yours=none");
console.log(`route=${frames.filter((f) => f.file !== "<anonymous>" && !f.file.startsWith("node:")).map((f) => f.fn).join(" <- ")}`);
