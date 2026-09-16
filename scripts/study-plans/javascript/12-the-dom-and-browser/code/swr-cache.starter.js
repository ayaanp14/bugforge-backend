"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, v) => new Promise((r) => setTimeout(r, ms, v));
let fetches = 0;
async function fetchValue(key) { fetches++; await sleep(10); return `${key}#${fetches}`; }
class SwrCache {
  #entries = new Map();   // key -> { value, at, revalidating }
  constructor(ttlMs) { this.ttl = ttlMs; }
  async get(key) {
    // TODO: miss -> fetch and store; fresh -> return; stale -> return the stale value now and revalidate once in the background
  }
}
