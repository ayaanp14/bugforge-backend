"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const groups = {
  language: ["Array", "Math", "JSON", "Promise", "Map", "Object", "Number", "String"],
  node: ["process", "require", "Buffer", "__dirname", "module"],
  browser: ["document", "window", "localStorage", "navigator", "alert"],
  both: ["console", "setTimeout", "setInterval", "queueMicrotask"],
};
const n = Number(tokens[0]);
for (let i = 1; i <= n; i++) {
  const name = tokens[i];
  const found = Object.entries(groups).find(([, names]) => names.includes(name));
  console.log(`${name}: ${found ? found[0] : "unknown"}`);
}
