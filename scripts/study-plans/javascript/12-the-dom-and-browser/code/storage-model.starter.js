"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class WebStorage {
  #data = new Map();
  constructor(quotaBytes, name, bus) { this.quota = quotaBytes; this.name = name; this.bus = bus; }
  // TODO: setItem (String() coercion, quota -> throw QuotaExceededError, emit storage event to other tabs), getItem (null), removeItem, key(i), get length
}
// TODO: two tabs sharing one origin; commands `<tab> set k v` | `<tab> get k` | `<tab> remove k` | `<tab> json k <json>` | `<tab> keys`
