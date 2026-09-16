"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function setIn(obj, keys, value) {
  if (keys.length === 0) return value;
  const [head, ...tail] = keys;
  return { ...obj, [head]: setIn(obj?.[head] ?? {}, tail, value) };
}
const history = [JSON.parse(lines[0])];
let cursor = 0;
const shared = (a, b) => Object.keys(a).filter((k) => a[k] === b[k]).join(",") || "-";
for (const line of lines.slice(1)) {
  const [cmd, path, ...rest] = line.trim().split(/\s+/);
  if (cmd === "set") {
    const next = setIn(history[cursor], path.split("."), JSON.parse(rest.join(" ")));
    history.splice(cursor + 1);              // a new edit discards any redo future
    history.push(next);
    cursor++;
    console.log(`set ${path}: shared=${shared(history[cursor - 1], next)}`);
  } else if (cmd === "undo") {
    if (cursor > 0) cursor--;
    console.log(`undo -> ${cursor}`);
  } else if (cmd === "redo") {
    if (cursor < history.length - 1) cursor++;
    console.log(`redo -> ${cursor}`);
  } else if (cmd === "show") console.log(`state=${JSON.stringify(history[cursor])} history=${history.length}`);
}
