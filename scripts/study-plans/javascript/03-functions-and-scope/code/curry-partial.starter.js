"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const curry = (f) => f;                              // TODO
const partial = (f, ...fixed) => (...rest) => f(...fixed, ...rest);
const volume = curry((l, w, h) => l * w * h);
const greet = (greeting, name) => `${greeting}, ${name}`;
const hello = partial(greet, "Hello");
const n = Number(tokens[0]);
for (let i = 0; i < n; i++) {
  const l = Number(tokens[1 + 4 * i]), w = Number(tokens[2 + 4 * i]), h = Number(tokens[3 + 4 * i]), name = tokens[4 + 4 * i];
  // TODO
}
