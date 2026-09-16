"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);                       // every call restarts the clock
    timer = setTimeout(() => fn(...args), wait);
  };
}
function throttle(fn, wait) {
  let last = -Infinity;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) { last = now; fn(...args); }
  };
}
const wait = Number(lines[0]);
const calls = lines.slice(1).map((l) => { const [t, label] = l.trim().split(/\s+/); return { t: Number(t), label }; });
let debounceFired = 0, throttleFired = 0;
const d = debounce((label) => { debounceFired++; console.log(`debounce:${label}`); }, wait);
const th = throttle((label) => { throttleFired++; console.log(`throttle:${label}`); }, wait);
for (const c of calls) setTimeout(() => { th(c.label); d(c.label); }, c.t);
const last = Math.max(...calls.map((c) => c.t));
setTimeout(() => console.log(`calls=${calls.length} debounceFired=${debounceFired} throttleFired=${throttleFired}`), last + 2 * wait);
