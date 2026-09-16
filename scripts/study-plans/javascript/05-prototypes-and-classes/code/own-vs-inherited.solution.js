"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const proto = JSON.parse(lines[0]);
const child = Object.assign(Object.create(proto), JSON.parse(lines[1]));
console.log(`keys=${Object.keys(child).join(",")}`);
const forIn = [];
for (const k in child) forIn.push(k);
console.log(`forIn=${forIn.join(",")}`);
for (const k of new Set([...Object.keys(proto), ...Object.keys(child)])) {
  console.log(`${k}: in=${k in child} own=${Object.hasOwn(child, k)} value=${child[k]}`);
}
const shadows = Object.keys(child).filter((k) => Object.hasOwn(proto, k));
for (const k of shadows) delete child[k];
console.log(`unshadowed: ${shadows.map((k) => `${k}=${child[k]}`).join(", ") || "-"}`);
