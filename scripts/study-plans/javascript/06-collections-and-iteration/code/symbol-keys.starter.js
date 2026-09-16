"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const stringKeys = lines[0].trim().split(/\s+/);
const symbolNames = lines[1].trim().split(/\s+/);
// TODO: build one object with both kinds of keys and report
