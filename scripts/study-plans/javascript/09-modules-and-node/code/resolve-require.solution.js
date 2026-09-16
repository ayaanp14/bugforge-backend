"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const path = require("node:path").posix;
const CORE = new Set(["fs", "path", "os", "http", "events", "util", "url", "crypto", "stream"]);
const files = new Set();        // absolute file paths
const mains = new Map();        // package dir -> main
function tryFile(p) {
  for (const candidate of [p, `${p}.js`, `${p}.json`]) if (files.has(candidate)) return candidate;
  return null;
}
function tryDirectory(dir) {
  if (mains.has(dir)) {
    const viaMain = tryFile(path.join(dir, mains.get(dir)));
    if (viaMain) return viaMain;
  }
  return tryFile(path.join(dir, "index"));      // index.js / index.json
}
function loadAs(base) { return tryFile(base) ?? tryDirectory(base); }
function resolve(fromDir, spec) {
  if (CORE.has(spec.replace(/^node:/, ""))) return `<core ${spec.replace(/^node:/, "")}>`;
  if (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/")) return loadAs(path.normalize(path.join(fromDir, spec)));
  for (let dir = fromDir; ; dir = path.dirname(dir)) {
    const found = loadAs(path.join(dir, "node_modules", spec));
    if (found) return found;
    if (dir === "/") return null;
  }
}
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  if (cmd === "file") files.add(path.normalize(a));
  else if (cmd === "pkg") mains.set(path.normalize(a), b);
  else if (cmd === "require") console.log(`${a} require(${b}) -> ${resolve(a, b) ?? "MODULE_NOT_FOUND"}`);
}
