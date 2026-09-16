"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const DEFAULTS = { port: 3000, host: "localhost", retries: 3, debug: false };
const config = JSON.parse(lines[0]);
const n = Number(lines[1]);
const text = lines[2] ?? "";
// TODO: merge with ??= (not ||=), read nested with ?., BigInt factorial, matchAll, replaceAll, numeric separators
