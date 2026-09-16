"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
if (!Object.groupBy) Object.groupBy = (items, key) => {
  const groups = Object.create(null);                          // null prototype, like the standard: no inherited keys
  let i = 0;
  for (const item of items) (groups[key(item, i++)] ??= []).push(item);
  return groups;
};
if (!Map.groupBy) Map.groupBy = (items, key) => {
  const groups = new Map();
  let i = 0;
  for (const item of items) { const k = key(item, i++); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(item); }
  return groups;
};
if (!Promise.withResolvers) Promise.withResolvers = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};
if (!Array.fromAsync) Array.fromAsync = async (iterable, mapFn = (x) => x) => {
  const out = [];
  let i = 0;
  for await (const x of iterable) out.push(await mapFn(x, i++));
  return out;
};
const people = lines.map((l) => { const [name, city, age] = l.trim().split(/\s+/); return { name, city, age: Number(age) }; });
async function main() {
  const byCity = Object.groupBy(people, (p) => p.city);
  console.log(`Object.groupBy: ${Object.keys(byCity).sort().map((c) => `${c}=${byCity[c].map((p) => p.name).join(",")}`).join(" ")} nullProto=${Object.getPrototypeOf(byCity) === null} inheritsToString=${"toString" in byCity}`);
  const byAdult = Map.groupBy(people, (p) => p.age >= 18);
  console.log(`Map.groupBy: adults=${(byAdult.get(true) ?? []).map((p) => p.name).join(",") || "-"} minors=${(byAdult.get(false) ?? []).map((p) => p.name).join(",") || "-"} keysAreBooleans=${[...byAdult.keys()].every((k) => typeof k === "boolean")}`);
  const { promise, resolve } = Promise.withResolvers();
  setTimeout(() => resolve("settled from a timer"), 5);        // the deferred pattern: resolve from outside the executor
  console.log(`withResolvers: ${await promise}`);
  async function* ages() { for (const p of people) { await null; yield p.age; } }
  console.log(`fromAsync: ${JSON.stringify(await Array.fromAsync(ages(), (a) => a * 2))}`);
}
main();
