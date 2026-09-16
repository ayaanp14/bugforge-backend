"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, v) => new Promise((r) => setTimeout(r, ms, v));
let fetches = 0;
async function fetchValue(key) { fetches++; await sleep(10); return `${key}#${fetches}`; }
class SwrCache {
  #entries = new Map();   // key -> { value, at, revalidating }
  constructor(ttlMs) { this.ttl = ttlMs; }
  async get(key) {
    const entry = this.#entries.get(key);
    if (!entry) {
      const value = await fetchValue(key);
      this.#entries.set(key, { value, at: Date.now(), revalidating: null });
      return { status: "miss", value };
    }
    if (Date.now() - entry.at < this.ttl) return { status: "hit", value: entry.value };
    if (!entry.revalidating) {                                        // stale: serve it now, refresh once in the background
      entry.revalidating = fetchValue(key).then((value) => { Object.assign(entry, { value, at: Date.now(), revalidating: null }); });
    }
    return { status: "stale", value: entry.value };
  }
}
async function main() {
  const cache = new SwrCache(Number(lines[0]));
  for (const line of lines.slice(1)) {
    const [cmd, arg] = line.trim().split(/\s+/);
    if (cmd === "wait") { await sleep(Number(arg)); console.log(`  (waited ${arg} ms)`); }
    else if (cmd === "get") { const r = await cache.get(arg); console.log(`get ${arg}: ${r.status} ${r.value} fetches=${fetches}`); }
  }
}
main();
