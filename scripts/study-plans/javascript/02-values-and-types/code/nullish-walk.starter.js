"use strict";
const [objLine, pathLine, fallback] = require("fs").readFileSync(0, "utf8").split("\n");
const root = JSON.parse(objLine);
const keys = pathLine.trim().split(".");
// TODO: walk the keys, stopping with undefined when a step is null or undefined
