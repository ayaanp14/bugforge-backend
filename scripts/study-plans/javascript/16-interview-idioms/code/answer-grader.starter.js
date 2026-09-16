"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Line 1: `keywords: a, b, c`; line 2: `misconceptions: x, y`; then `<candidate>: <answer>` lines.
// TODO: coverage of keywords (case-insensitive phrase match), flagged misconceptions, word count; grade strong (>=80%, none flagged) / partial (>=50%) / weak; sort by score
