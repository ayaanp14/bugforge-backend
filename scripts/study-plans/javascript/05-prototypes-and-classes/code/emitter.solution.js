"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Emitter {
  #listeners = new Map();   // event -> [{ id, fn, once }]
  #list(event) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, []);
    return this.#listeners.get(event);
  }
  on(event, id, fn, once = false) {
    this.#list(event).push({ id, fn, once });
    return () => this.off(event, id);
  }
  once(event, id, fn) { return this.on(event, id, fn, true); }
  off(event, id) {
    const list = this.#list(event);
    const at = list.findIndex((l) => l.id === id);
    if (at !== -1) list.splice(at, 1);
    return at !== -1;
  }
  emit(event, payload) {
    const list = [...this.#list(event)];          // a copy: listeners may unsubscribe while we iterate
    for (const l of list) {
      l.fn(payload);
      if (l.once) this.off(event, l.id);
    }
    return list.length;
  }
  count(event) { return this.#list(event).length; }
}
const em = new Emitter();
for (const line of lines) {
  const [cmd, event, arg] = line.trim().split(/\s+/);
  if (cmd === "on") em.on(event, arg, (p) => console.log(`${arg}:${event}:${p}`));
  else if (cmd === "once") em.once(event, arg, (p) => console.log(`${arg}:${event}:${p}`));
  else if (cmd === "off") console.log(`off ${event} ${arg} -> ${em.off(event, arg)}`);
  else if (cmd === "emit") console.log(`emit ${event} -> ${em.emit(event, arg)}`);
  else if (cmd === "count") console.log(`count ${event} = ${em.count(event)}`);
}
