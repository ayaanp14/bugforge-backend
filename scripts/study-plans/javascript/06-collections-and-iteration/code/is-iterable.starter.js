"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
for (const line of lines) {
  const value = JSON.parse(line);
  // TODO
}
