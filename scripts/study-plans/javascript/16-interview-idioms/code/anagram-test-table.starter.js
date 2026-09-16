"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Each line: `<a> | <b> | <expected>` — a test table for isAnagram, which must ignore case, spaces, punctuation and Unicode normalisation form.
const key = (s) => s;   // TODO: NFC-normalise, lower-case, strip everything but letters and digits, sort the code points
const isAnagram = (a, b) => key(a) === key(b);
// TODO: run the table and print `ok  ` / `FAIL` rows and a summary
