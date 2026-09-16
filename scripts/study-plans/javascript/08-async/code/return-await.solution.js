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
  try { return await work(id); } catch (err) { return `caught inside: ${err.message}`; }
}
async function main() {
  const ids = lines[0].trim().split(/\s+/);
  for (const id of ids) {
    let a, b;
    try { a = await withoutAwait(id); } catch (err) { a = `caught outside: ${err.message}`; }
    try { b = await withAwait(id); } catch (err) { b = `caught outside: ${err.message}`; }
    console.log(`${id}: withoutAwait -> ${a} | withAwait -> ${b}`);
  }
  let finished = 0;
  ids.forEach(async (id) => { await work(id).catch(() => {}); finished++; });
  console.log(`afterForEach=${finished}`);                 // forEach did not wait for anything
  await Promise.all(ids.map((id) => work(id).catch(() => {})));
  console.log(`afterPromiseAll=${finished}`);
}
main();
