"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const parse = (text) => { const n = Number(text); if (Number.isNaN(n)) throw new TypeError(`not a number: ${text}`); return n; };
const validate = (n) => (n < 0 ? Promise.reject(new RangeError(`negative: ${n}`)) : n);
const double = (n) => sleep(2, n * 2);        // asynchronous step
const format = (n) => `${n.toFixed(1)}`;
let settled = 0;
// TODO: for each token build parse -> validate -> double -> format with then/catch/finally, one after another
