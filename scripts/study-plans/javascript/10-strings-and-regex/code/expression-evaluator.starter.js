"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const TOKEN = /\s*(?:(?<num>\d+(?:\.\d+)?)|(?<op>[-+*/()]))/y;
function tokenize(src) {
  // TODO: sticky tokenizer with positions and an eof token; SyntaxError on an unexpected character
}
function evaluate(src) {
  // TODO: expr := term (('+'|'-') term)*; term := factor (('*'|'/') factor)*; factor := '-' factor | number | '(' expr ')'
}
for (const line of lines) {
  try { console.log(`${line.trim()} = ${evaluate(line)}`); }
  catch (err) { console.log(`${err.name}: ${err.message}`); }
}
