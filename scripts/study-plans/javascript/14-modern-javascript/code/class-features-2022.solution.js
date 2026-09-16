"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Counter {
  static instances = 0;
  static registry;
  static { Counter.registry = new Map(); }        // static initialisation block: several statements at class definition time
  #count = 0;
  #history = [];
  constructor(name) { this.name = name; Counter.instances++; Counter.registry.set(name, this); }
  #bump() { this.#count++; this.#history.push(this.#count); }   // private method
  inc(times = 1) { for (let i = 0; i < times; i++) this.#bump(); return this; }
  get value() { return this.#count; }
  get last() { return this.#history.at(-1) ?? null; }           // at(-1): the last element without length - 1
  static isCounter(x) { return typeof x === "object" && x !== null && #count in x; }   // brand check: is this really one of ours?
}
for (const line of lines) {
  const [cmd, name, arg] = line.trim().split(/\s+/);
  try {
    if (cmd === "new") console.log(`new ${name}: instances=${new Counter(name) && Counter.instances}`);
    else if (cmd === "inc") console.log(`${name}: value=${Counter.registry.get(name).inc(Number(arg)).value}`);
    else if (cmd === "check") console.log(`isCounter(${name})=${Counter.isCounter(Counter.registry.get(name))} isCounter(plain)=${Counter.isCounter({ name })} hasOwn(name)=${Object.hasOwn(Counter.registry.get(name), "name")} hasOwn(value)=${Object.hasOwn(Counter.registry.get(name), "value")}`);
    else if (cmd === "last") console.log(`${name}: last=${Counter.registry.get(name).last}`);
    else if (cmd === "fail") {
      try { throw new RangeError(`inner: ${arg ?? name}`); }
      catch (inner) { throw new Error(`outer: ${name} failed`, { cause: inner }); }
    }
  } catch (err) {
    console.log(`${err.message} <- ${err.cause?.name}: ${err.cause?.message}`);
  }
}
const m = /(?<word>\w+)@(?<host>\w+)/d.exec("mail ada@example now");
console.log(`indices: word=${m.indices.groups.word.join("-")} host=${m.indices.groups.host.join("-")}`);
