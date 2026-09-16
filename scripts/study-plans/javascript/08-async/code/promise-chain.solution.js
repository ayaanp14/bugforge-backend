"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const parse = (text) => { const n = Number(text); if (Number.isNaN(n)) throw new TypeError(`not a number: ${text}`); return n; };
const validate = (n) => (n < 0 ? Promise.reject(new RangeError(`negative: ${n}`)) : n);
const double = (n) => sleep(2, n * 2);        // asynchronous step
const format = (n) => `${n.toFixed(1)}`;
let settled = 0;
const tokens = lines[0].trim().split(/\s+/);
tokens
  .reduce((chain, token) => chain.then(() =>
    Promise.resolve(token)
      .then(parse)                     // a throw here becomes a rejection
      .then(validate)                  // returns a value or a rejected promise — both handled the same way
      .then(double)                    // returns a promise: the chain waits for it
      .then(format)
      .then((out) => console.log(`${token} -> ${out}`))
      .catch((err) => console.log(`${token} -> ${err.name}: ${err.message}`))
      .finally(() => { settled++; })
  ), Promise.resolve())
  .then(() => console.log(`settled=${settled}`));
