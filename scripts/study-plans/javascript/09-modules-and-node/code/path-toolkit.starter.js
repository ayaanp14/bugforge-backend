"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const path = require("node:path").posix;   // posix on purpose: the same answers on every OS
const CWD = "/home/user/project";
for (const line of lines) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  // TODO: join | resolve (from CWD) | normalize | basename [ext] | extname | dirname | relative | parse
}
