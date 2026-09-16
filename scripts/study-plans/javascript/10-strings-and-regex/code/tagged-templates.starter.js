"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function html(strings, ...values) {
  // TODO: escape & < > " ' in every interpolated value
}
function sql(strings, ...values) {
  // TODO: return { text, values } with $1, $2 placeholders
}
const [name, comment, id] = lines;
// TODO
