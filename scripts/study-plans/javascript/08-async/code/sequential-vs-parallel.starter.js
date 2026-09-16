"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const tasks = lines.map((l) => { const [name, ms] = l.trim().split(/\s+/); return { name, ms: Number(ms) }; });
async function main() {
  // TODO: sequential (await in a for…of) and parallel (Promise.all); record completion order for each
}
main();
