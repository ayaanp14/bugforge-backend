"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const snippets = {
  "read-undefined": () => undefined.x,
  "call-undefined": () => { const f = undefined; f(); },
  "negative-array": () => new Array(-1),
  "bad-json": () => JSON.parse("{"),
  "unknown-name": () => notDeclaredAnywhere,
  "bad-uri": () => decodeURIComponent("%"),
  "bigint-fraction": () => BigInt(1.5),
  "too-many-digits": () => (1).toFixed(101),
  "frozen-write": () => { const o = Object.freeze({ a: 1 }); o.a = 2; },
  "const-assign": () => new Function('"use strict"; const a = 1; a = 2;')(),
  "repeat-negative": () => "x".repeat(-1),
  "throw-string": () => { throw "just text"; },
};
for (const name of lines.map((l) => l.trim())) {
  // TODO: run the snippet, print `<name>: <constructor name> instanceofError=<bool>`
}
