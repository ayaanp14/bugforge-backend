"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const people = lines.map((l) => {
  const [name, age, city] = l.split(",").map((s) => s.trim());
  return { name, age: Number(age), city };
});
const byCity = people.reduce((acc, { city, name }) => { (acc[city] ??= []).push(name); return acc; }, {});
for (const [city, names] of Object.entries(byCity).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`${city}: ${[...names].sort().join(" ")}`);
}
const { name: oldest } = people.reduce((best, p) => (p.age > best.age ? p : best));
const averageAge = people.reduce((sum, { age }) => sum + age, 0) / people.length;
console.log(`oldest=${oldest} average=${averageAge.toFixed(1)}`);
const [{ name: first }, ...others] = people;
console.log(`first=${first} others=${others.length}`);
