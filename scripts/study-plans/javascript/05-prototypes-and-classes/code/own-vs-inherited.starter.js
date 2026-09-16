"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const proto = JSON.parse(lines[0]);
const child = Object.assign(Object.create(proto), JSON.parse(lines[1]));
// TODO
