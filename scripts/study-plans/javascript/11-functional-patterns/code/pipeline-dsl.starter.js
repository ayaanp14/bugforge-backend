"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const [spec, ...recordLines] = lines;
const records = recordLines.map((l) => JSON.parse(l));
const OPS = { ">": (a, b) => a > b, "<": (a, b) => a < b, ">=": (a, b) => a >= b, "<=": (a, b) => a <= b, "==": (a, b) => a == b, "!=": (a, b) => a != b };
function compile(step) {
  // TODO: filter <field><op><value> | map <field> | sort [field] [desc] | take n | uniq | count | sum <field> — return a function over an array
}
// TODO: split the spec on |, compile each step, pipe them, print JSON
