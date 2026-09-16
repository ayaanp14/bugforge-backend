"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const { StringDecoder } = require("node:string_decoder");
const [b64, hex] = lines;
// TODO
