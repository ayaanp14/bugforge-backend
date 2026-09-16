"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const [a, b] = lines[0].trim().split(/\s+/);      // the same word, precomposed and decomposed
const words = lines[1].trim().split(/\s+/);
// TODO
