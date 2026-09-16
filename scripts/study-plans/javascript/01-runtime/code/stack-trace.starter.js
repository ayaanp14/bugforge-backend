"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const [head, ...frames] = lines;
// TODO
