"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// TODO: thousands separators, letter/digit counts with \p{...}, password lookaheads, format validation table
