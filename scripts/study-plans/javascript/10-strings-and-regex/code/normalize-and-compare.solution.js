"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const [a, b] = lines[0].trim().split(/\s+/);      // the same word, precomposed and decomposed
const words = lines[1].trim().split(/\s+/);
console.log(`equal=${a === b} normalizedEqual=${a.normalize("NFC") === b.normalize("NFC")} lengths=${a.length},${b.length} nfdLengths=${a.normalize("NFD").length},${b.normalize("NFD").length}`);
console.log(`sortDefault=${[...words].sort().join(" ")}`);
const collator = new Intl.Collator("en", { numeric: true });
console.log(`sortCollator=${[...words].sort(collator.compare).join(" ")}`);
const base = new Intl.Collator("en", { sensitivity: "base" });
console.log(`baseEqual(Apple,apple)=${base.compare("Apple", "apple") === 0} baseEqual(e,${String.fromCodePoint(0xe9)})=${base.compare("e", String.fromCodePoint(0xe9)) === 0}`);
const sharp = `stra${String.fromCodePoint(0xdf)}e`;
console.log(`upper=${sharp.toUpperCase()} lengthChange=${sharp.length}->${sharp.toUpperCase().length} turkishI=${"i".toLocaleUpperCase("tr").codePointAt(0).toString(16)}`);
