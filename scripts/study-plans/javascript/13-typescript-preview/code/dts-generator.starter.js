"use strict";
const input = require("fs").readFileSync(0, "utf8");
// Exports described as JSON: primitives/arrays/objects are values; {"fn": <arity>} is a function; {"class": [fields], "methods": [names]} is a class.
const exportsMap = JSON.parse(input);
function inferType(value) {
  // TODO: string | number | boolean | null | T[] (union of element types) | { k: T; ... }
}
// TODO: print one `export declare ...;` line per export, in key order
