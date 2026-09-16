"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
async function work(id) {
  await sleep(1);
  if (id.endsWith("x")) throw new Error(`${id} failed`);
  return `${id} done`;
}
async function withoutAwait(id) {
  try { return work(id); } catch (err) { return `caught inside: ${err.message}`; }
}
async function withAwait(id) {
  // TODO: same, but return await
}
async function main() {
  // TODO: for each id print both, then the forEach demonstration
}
main();
