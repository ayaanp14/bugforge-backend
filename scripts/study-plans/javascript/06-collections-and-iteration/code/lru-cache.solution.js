"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class LRUCache {
  #map = new Map();     // insertion order = recency: oldest first
  constructor(capacity) { this.capacity = capacity; }
  get(key) {
    if (!this.#map.has(key)) return -1;
    const value = this.#map.get(key);
    this.#map.delete(key);
    this.#map.set(key, value);      // re-insert: now the newest
    return value;
  }
  put(key, value) {
    if (this.#map.has(key)) this.#map.delete(key);
    this.#map.set(key, value);
    if (this.#map.size > this.capacity) {
      const oldest = this.#map.keys().next().value;
      this.#map.delete(oldest);
      return oldest;
    }
    return null;
  }
  get size() { return this.#map.size; }
  *entries() { yield* [...this.#map].reverse(); }
}
const cache = new LRUCache(Number(lines[0]));
for (const line of lines.slice(1)) {
  const [cmd, k, v] = line.trim().split(/\s+/);
  if (cmd === "put") {
    const evicted = cache.put(k, Number(v));
    if (evicted !== null) console.log(`evict ${evicted}`);
  } else if (cmd === "get") console.log(`get ${k} -> ${cache.get(k)}`);
  else if (cmd === "show") console.log(`[${[...cache.entries()].map(([key, val]) => `${key}=${val}`).join(", ")}] size=${cache.size}`);
}
