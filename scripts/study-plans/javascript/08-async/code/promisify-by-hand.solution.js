"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function readFile(name, cb) {
  setTimeout(() => {
    if (name.startsWith("missing")) return cb(Object.assign(new Error(`ENOENT: ${name}`), { code: "ENOENT" }));
    cb(null, `<contents of ${name}>`);
  }, 3);
}
function promisify(fn) {
  return (...args) => new Promise((resolve, reject) => {
    fn(...args, (err, value) => (err ? reject(err) : resolve(value)));
  });
}
const read = promisify(readFile);
const names = lines[0].trim().split(/\s+/);
names
  .reduce((chain, name) => chain.then(() => read(name).then(
    (text) => console.log(`${name}: ${text}`),
    (err) => console.log(`${name}: ${err.code}`),
  )), Promise.resolve())
  .then(() => {
    const p = Promise.resolve(1);
    console.log(`identity=${Promise.resolve(p) === p}`);
    const thenable = { then(resolve) { resolve("adopted"); } };
    return Promise.resolve(thenable);        // a thenable is adopted, not wrapped
  })
  .then((v) => console.log(`thenable=${v}`));
