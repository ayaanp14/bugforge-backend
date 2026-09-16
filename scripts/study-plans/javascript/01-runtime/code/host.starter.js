"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const groups = {
  language: ["Array", "Math", "JSON", "Promise", "Map", "Object", "Number", "String"],
  // TODO: node, browser, both
};
// TODO
