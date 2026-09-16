"use strict";
const input = require("fs").readFileSync(0, "utf8");
const { Readable, Transform, Writable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const readline = require("node:readline");
async function main() {
  // TODO: parse lines into { level, message } objects, drop below the minimum level, collect; then the failing pipeline; then readline
}
main();
