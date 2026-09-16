"use strict";
const s = require("fs").readFileSync(0, "utf8").replace(/\r?\n$/, "");
const chars = [...s];
console.log(`length=${s.length} codePoints=${chars.length}`);
console.log(`reversed=${chars.reverse().join("")}`);
console.log(`upper=${s.toUpperCase()}`);
console.log(`first=${[...s][0] ?? ""} last=${[...s].at(-1) ?? ""}`);
