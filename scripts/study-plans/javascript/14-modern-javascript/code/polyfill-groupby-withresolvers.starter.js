"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// TODO: guarded polyfills for Object.groupBy, Map.groupBy, Promise.withResolvers, Array.fromAsync
const people = lines.map((l) => { const [name, city, age] = l.trim().split(/\s+/); return { name, city, age: Number(age) }; });
