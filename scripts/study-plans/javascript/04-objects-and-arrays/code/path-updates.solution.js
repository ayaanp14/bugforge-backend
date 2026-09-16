"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const original = JSON.parse(lines[0]);
function setPath(obj, keys, value) {
  if (keys.length === 0) return value;
  const [head, ...tail] = keys;
  const inner = obj !== null && typeof obj === "object" ? obj[head] : undefined;
  return { ...obj, [head]: setPath(inner ?? {}, tail, value) };
}
let current = original;
for (const line of lines.slice(1)) {
  const [, path, ...rest] = line.trim().split(/\s+/);
  current = setPath(current, path.split("."), JSON.parse(rest.join(" ")));
}
console.log(`final=${JSON.stringify(current)}`);
console.log(`original=${JSON.stringify(original)}`);
const untouched = Object.keys(original).filter((k) => original[k] === current[k]);
console.log(`shared=${untouched.join(",") || "-"}`);
