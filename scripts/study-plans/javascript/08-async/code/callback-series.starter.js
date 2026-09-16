"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function loadUser(name, cb) {
  setTimeout(() => {
    if (name === "bad") return cb(new Error(`no user ${name}`));
    cb(null, name.toUpperCase());
  }, name.length * 3);
}
function series(names, cb) {
  // TODO: one after another; stop at the first error: cb(err, resultsSoFar)
}
function parallel(names, cb) {
  // TODO: all at once; results in input order; cb exactly once
}
series(lines[0].trim().split(/\s+/), (err, results) => {
  // TODO print, then run parallel on line 2
});
