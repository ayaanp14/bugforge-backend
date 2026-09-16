"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// reverse <s> | palindrome <text…> | camel <kebab-case> | kebab <camelCase> | title <text…> | truncate <n> <text…> | rle <s> | count <char> <text…> | pad <width> <n> | words <text…>
for (const line of lines) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  // TODO
}
