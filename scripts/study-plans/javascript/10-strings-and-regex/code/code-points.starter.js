"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const hex = (s) => [...s].map((c) => c.codePointAt(0).toString(16)).join(" ");
const s = String.fromCodePoint(...lines[0].trim().split(/\s+/).map((h) => parseInt(h, 16)));
// TODO: length, code points, graphemes (Intl.Segmenter), code units in hex, first code point vs first code unit, two reversals
