"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const n = Number(tokens[0]);

function scenario(name) {
  try {
    switch (name) {
      case "var-before": {
        const seen = typeof v;      // hoisted, initialised to undefined
        var v = 1;
        return seen;
      }
      case "let-before": {
        const seen = l;             // temporal dead zone
        let l = 1;
        return String(seen);
      }
      case "const-reassign": {
        const c = 1;
        // eslint-disable-next-line no-const-assign
        c = 2;
        return "reassigned";
      }
      case "const-mutate": {
        const o = { x: 1 };
        o.x = 2;
        return `mutated to ${o.x}`;
      }
      case "block-leak": {
        { var leaked = 1; let kept = 2; }
        return `var=${typeof leaked} let=${typeof kept}`;
      }
      default:
        return "unknown";
    }
  } catch (e) {
    return e.constructor.name;
  }
}

for (let i = 1; i <= n; i++) console.log(`${tokens[i]}: ${scenario(tokens[i])}`);
