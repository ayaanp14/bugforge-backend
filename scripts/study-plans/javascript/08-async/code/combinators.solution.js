"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const specs = lines.map((l) => { const [name, ms, outcome] = l.trim().split(/\s+/); return { name, ms: Number(ms), ok: outcome === "ok" }; });
const start = (s) => sleep(s.ms).then(() => (s.ok ? s.name : Promise.reject(new Error(`${s.name} failed`))));
async function main() {
  try {
    console.log(`all: ${(await Promise.all(specs.map(start))).join(",")}`);
  } catch (err) {
    console.log(`all: rejected ${err.message}`);
  }
  const settled = await Promise.allSettled(specs.map(start));
  console.log(`allSettled: ${settled.map((r, i) => `${specs[i].name}:${r.status}`).join(" ")}`);
  await Promise.race(specs.map(start)).then(
    (v) => console.log(`race: ${v} fulfilled`),
    (err) => console.log(`race: ${err.message.split(" ")[0]} rejected`),
  );
  try {
    console.log(`any: ${await Promise.any(specs.map(start))}`);
  } catch (err) {
    console.log(`any: ${err.constructor.name} with ${err.errors.length} errors`);
  }
}
main();
