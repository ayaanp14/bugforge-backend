"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const n = Number(lines[0]);
function trampoline(f) {
  // TODO: call f, then keep calling while the result is a function
}
// TODO: sumTo (tail-recursive via thunks), sumLoop, isEven/isOdd mutual recursion via thunks
