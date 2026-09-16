"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function readFile(name, cb) {
  setTimeout(() => {
    if (name.startsWith("missing")) return cb(Object.assign(new Error(`ENOENT: ${name}`), { code: "ENOENT" }));
    cb(null, `<contents of ${name}>`);
  }, 3);
}
function promisify(fn) {
  // TODO: return (...args) => new Promise(...) calling fn(...args, callback)
}
const read = promisify(readFile);
// TODO: read each name in order, printing `<name>: <contents>` or `<name>: <code>`; then the thenable/identity checks
