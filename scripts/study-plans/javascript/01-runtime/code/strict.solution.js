"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);

function attempt(name) {
  try {
    switch (name) {
      case "undeclared": {
        // eslint-disable-next-line no-undef
        neverDeclared = 1;
        return "no error";
      }
      case "frozen": {
        const o = Object.freeze({});
        o.x = 1;
        return "no error";
      }
      case "delete-builtin": {
        delete Object.prototype;
        return "no error";
      }
      case "this-plain-call": {
        const f = function () { return this; };
        return f() === undefined ? "undefined" : "defined";
      }
      default: {
        Math.sqrt(-1);
        return "no error";
      }
    }
  } catch (e) {
    return e.constructor.name;
  }
}

for (let i = 1; i <= n; i++) console.log(`${tokens[i]}: ${attempt(tokens[i])}`);
