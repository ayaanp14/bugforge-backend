"use strict";
const input = require("fs").readFileSync(0, "utf8");
const { Readable, Transform, Writable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
async function main() {
  // TODO: lines -> parse `<iso-time> <LEVEL> <message>` -> keep >= min level -> summarise
}
main();
