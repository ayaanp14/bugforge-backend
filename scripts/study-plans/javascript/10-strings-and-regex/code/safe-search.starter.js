"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const [query, ...rest] = lines;
// TODO: highlight the escaped query in each text line; show what the raw query would do; flag suspicious patterns
