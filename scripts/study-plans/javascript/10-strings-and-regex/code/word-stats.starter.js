"use strict";
const input = require("fs").readFileSync(0, "utf8");
const segmenter = new Intl.Segmenter("en", { granularity: "word" });
const graphemes = (s) => [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(s)].length;
// TODO: words via the segmenter (isWordLike), NFC + lower-case, frequencies, longest by graphemes, letters/digits via \p
