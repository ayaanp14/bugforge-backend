"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function loadUser(name, cb) {
  setTimeout(() => {
    if (name === "bad") return cb(new Error(`no user ${name}`));
    cb(null, name.toUpperCase());
  }, name.length * 3);
}
function series(names, cb) {
  const results = [];
  let i = 0;
  function next() {
    if (i === names.length) return cb(null, results);
    loadUser(names[i++], (err, value) => {
      if (err) return cb(err, results);
      results.push(value);
      next();
    });
  }
  next();
}
function parallel(names, cb) {
  const results = new Array(names.length);
  let pending = names.length, finished = false;
  if (pending === 0) return cb(null, results);
  names.forEach((name, i) => loadUser(name, (err, value) => {
    if (finished) return;                      // an earlier error already reported: call cb once only
    if (err) { finished = true; return cb(err); }
    results[i] = value;                        // by index: completion order does not matter
    if (--pending === 0) { finished = true; cb(null, results); }
  }));
}
series(lines[0].trim().split(/\s+/), (err, results) => {
  console.log(err ? `series error: ${err.message} after ${results.length} loaded` : `series: ${results.join(",")}`);
  parallel(lines[1].trim().split(/\s+/), (err2, all) => {
    console.log(err2 ? `parallel error: ${err2.message}` : `parallel: ${all.join(",")}`);
  });
});
