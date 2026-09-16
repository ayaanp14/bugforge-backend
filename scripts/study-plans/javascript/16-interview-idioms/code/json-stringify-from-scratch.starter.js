"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const evaluate = (src) => new Function(`return (${src});`)();   // the inputs are trusted JavaScript expressions
// Each line: `<expression> | <replacer expression or -> | <indent expression or ->`. Compare your stringify with the native one.
function stringify(value, replacer, indent) {
  // TODO: toJSON, replacer function/array, undefined/function/symbol omitted in objects and null in arrays, NaN/Infinity -> null,
  // boxed primitives unwrapped, BigInt and cycles throw TypeError, string escaping, indentation
}
