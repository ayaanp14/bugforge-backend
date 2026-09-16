"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const path = require("node:path").posix;
const CORE = new Set(["fs", "path", "os", "http", "events", "util", "url", "crypto", "stream"]);
const files = new Set();        // absolute file paths
const mains = new Map();        // package dir -> main
function tryFile(p) {
  // TODO: p, p.js, p.json
}
function tryDirectory(dir) {
  // TODO: package.json main (as a file), then index.js
}
function resolve(fromDir, spec) {
  // TODO: core | relative/absolute | bare (walk up node_modules)
}
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  if (cmd === "file") files.add(path.normalize(a));
  else if (cmd === "pkg") mains.set(path.normalize(a), b);
  else if (cmd === "require") console.log(`${a} require(${b}) -> ${resolve(a, b) ?? "MODULE_NOT_FOUND"}`);
}
