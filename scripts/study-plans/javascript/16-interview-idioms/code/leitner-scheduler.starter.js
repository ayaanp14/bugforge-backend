"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Line 1: `cards: a b c …` (all start in box 1). Then `session <n>: a=ok b=miss …`.
// Box 1 is due every session, box 2 every 2nd, box 3 every 4th; box 4 is mastered (retired). ok moves a due card up one box; miss sends it back to box 1.
// TODO: per session print due cards, results and the boxes; finish with the boxes and what is due next
