"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const specs = lines.map((l) => { const [name, ms, outcome] = l.trim().split(/\s+/); return { name, ms: Number(ms), ok: outcome === "ok" }; });
const start = (s) => sleep(s.ms).then(() => (s.ok ? s.name : Promise.reject(new Error(`${s.name} failed`))));
async function main() {
  // TODO: all, allSettled, race, any — each over fresh promises
}
main();
