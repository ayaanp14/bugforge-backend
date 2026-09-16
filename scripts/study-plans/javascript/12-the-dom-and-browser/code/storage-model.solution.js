"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class WebStorage {
  #data = new Map();
  constructor(quotaBytes, name, bus) { this.quota = quotaBytes; this.name = name; this.bus = bus; }
  #bytes() { let n = 0; for (const [k, v] of this.#data) n += k.length + v.length; return n; }
  setItem(key, value) {
    const text = String(value);                                     // objects become "[object Object]" — serialise first
    const old = this.#data.get(key) ?? null;
    const next = this.#bytes() - (old ? key.length + old.length : 0) + key.length + text.length;
    if (next > this.quota) throw Object.assign(new Error(`quota of ${this.quota} bytes exceeded`), { name: "QuotaExceededError" });
    this.#data.set(key, text);
    this.bus.emit({ key, oldValue: old, newValue: text, source: this.name });
  }
  getItem(key) { return this.#data.get(key) ?? null; }
  removeItem(key) { if (this.#data.has(key)) { const old = this.#data.get(key); this.#data.delete(key); this.bus.emit({ key, oldValue: old, newValue: null, source: this.name }); } }
  key(i) { return [...this.#data.keys()][i] ?? null; }
  get length() { return this.#data.size; }
}
const bus = { tabs: [], emit(e) { for (const t of this.tabs) if (t.name !== e.source) console.log(`  [${t.name}] storage event: key=${e.key} old=${JSON.stringify(e.oldValue)} new=${JSON.stringify(e.newValue)}`); } };
const quota = Number(lines[0]);
const A = new WebStorage(quota, "A", bus), B = new WebStorage(quota, "B", bus);
bus.tabs.push(A, B);
const tabs = { A, B };
for (const line of lines.slice(1)) {
  const [tab, cmd, key, ...rest] = line.trim().split(/\s+/);
  const s = tabs[tab];
  try {
    if (cmd === "set") { s.setItem(key, rest.join(" ")); console.log(`${tab} set ${key}`); }
    else if (cmd === "get") console.log(`${tab} get ${key} -> ${JSON.stringify(s.getItem(key))}`);
    else if (cmd === "remove") { s.removeItem(key); console.log(`${tab} removed ${key}`); }
    else if (cmd === "json") { s.setItem(key, JSON.stringify(JSON.parse(rest.join(" ")))); console.log(`${tab} json ${key} -> ${JSON.stringify(JSON.parse(s.getItem(key)))}`); }
    else if (cmd === "raw") { s.setItem(key, { a: 1 }); console.log(`${tab} raw ${key} -> ${JSON.stringify(s.getItem(key))}`); }
    else if (cmd === "keys") console.log(`${tab} keys=${JSON.stringify(Array.from({ length: s.length }, (_, i) => s.key(i)))} length=${s.length}`);
  } catch (err) {
    console.log(`${tab} ${cmd} ${key}: ${err.name}: ${err.message}`);
  }
}
