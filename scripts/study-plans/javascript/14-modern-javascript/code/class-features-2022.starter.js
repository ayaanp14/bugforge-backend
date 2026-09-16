"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Counter {
  // TODO: static instances with a static block, #count, #bump(), static isCounter(x) via `#count in x`, get value(), at-style history
}
// TODO: run commands: new <name> | inc <name> <times> | check <name> | last <name> | fail <message>
