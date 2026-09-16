"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const people = lines.map((l) => {
  const [name, age, city] = l.split(",").map((s) => s.trim());
  return { name, age: Number(age), city };
});
// TODO
