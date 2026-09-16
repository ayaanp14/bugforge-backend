"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const objects = new Map();   // name -> object
const nameOf = new Map();    // object -> name
for (const line of lines) {
  const [cmd, name, ...rest] = line.trim().split(/\s+/);
  if (cmd === "def") {
    const obj = Object.create(rest[0] === "-" ? null : objects.get(rest[0]));
    for (let i = 1; i + 1 < rest.length; i += 2) obj[rest[i]] = rest[i + 1];
    objects.set(name, obj);
    nameOf.set(obj, name);
  } else if (cmd === "get") {
    const obj = objects.get(name);
    let owner = obj;
    while (owner !== null && !Object.hasOwn(owner, rest[0])) owner = Object.getPrototypeOf(owner);
    if (owner === null) console.log(`${name}.${rest[0]} = undefined`);
    else console.log(`${name}.${rest[0]} = ${obj[rest[0]]} (${owner === obj ? "own" : "from " + nameOf.get(owner)})`);
  } else if (cmd === "set") {
    objects.get(name)[rest[0]] = rest[1];   // a write always lands on the object itself
  } else if (cmd === "chain") {
    const parts = [];
    for (let o = objects.get(name); o !== null; o = Object.getPrototypeOf(o)) parts.push(nameOf.get(o));
    console.log(parts.join(" -> "));
  }
}
