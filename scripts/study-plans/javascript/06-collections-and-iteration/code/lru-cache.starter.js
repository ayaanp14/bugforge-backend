"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class LRUCache {
  #map = new Map();
  constructor(capacity) { this.capacity = capacity; }
  // TODO: get(key) -> value or -1 (and mark as recently used); put(key, value) evicting the least recent; get size; entries() most-recent first
}
const cache = new LRUCache(Number(lines[0]));
for (const line of lines.slice(1)) {
  const [cmd, k, v] = line.trim().split(/\s+/);
  // TODO: put k v | get k | show
}
