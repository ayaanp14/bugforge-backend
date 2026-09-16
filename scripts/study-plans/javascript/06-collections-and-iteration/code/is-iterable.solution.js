"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
for (const line of lines) {
  const value = JSON.parse(line);
  const iterable = value !== null && value !== undefined && typeof value[Symbol.iterator] === "function";
  if (iterable) {
    const items = [...value];
    console.log(`${line.trim()}: iterable items=${items.length} first=${JSON.stringify(items[0])}`);
  } else if (value !== null && typeof value === "object") {
    console.log(`${line.trim()}: not iterable entries=${Object.entries(value).length}`);
  } else {
    console.log(`${line.trim()}: not iterable (${value === null ? "null" : typeof value})`);
  }
}
