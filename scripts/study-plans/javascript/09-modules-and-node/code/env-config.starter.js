"use strict";
const input = require("fs").readFileSync(0, "utf8");
function parseDotenv(text) {
  // TODO: KEY=VALUE, optional `export `, # comments, single/double quotes, ${VAR} expansion from earlier keys
}
const [envText, requiredLine] = input.split("\n---\n");
// TODO: parse, list missing required keys, print
