"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const rules = [
  // TODO: [regex, hint(match)] per error code: TS2322 TS2339 TS2345 TS7006 TS2531/TS18047/TS18048 TS2307 TS2564 TS2352
];
for (const line of lines) {
  // TODO: print `<code>: <hint>` or `<code>: no rule - read the last 'is not assignable' line`
}
