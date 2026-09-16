"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function debounce(fn, wait) {
  // TODO
}
function throttle(fn, wait) {
  // TODO: leading edge, Date.now() based
}
const wait = Number(lines[0]);
const calls = lines.slice(1).map((l) => { const [t, label] = l.trim().split(/\s+/); return { t: Number(t), label }; });
// TODO: schedule each call at its time for both wrappers; after the last call + 2*wait print the summary
