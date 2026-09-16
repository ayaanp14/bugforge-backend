"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [pattern, flagsLine, ...subjects] = input.split("\n").filter((l) => l !== "");
const flags = flagsLine.trim() === "-" ? "" : flagsLine.trim();
// TODO: for each subject print test/match/groups; then the lastIndex demonstration
