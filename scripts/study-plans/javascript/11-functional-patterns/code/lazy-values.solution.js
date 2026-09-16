"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const reads = Number(lines[0]);
let builds = 0;
const buildLogger = () => { builds++; return { level: "info" }; };
const once = (fn) => { let done = false, result; return (...a) => (done ? result : ((done = true), (result = fn(...a)))); };
const eager = (opts) => opts.logger ?? buildLogger();                          // ?? short-circuits: no build when a logger is supplied
const eagerArg = (opts, fallback = buildLogger()) => opts.logger ?? fallback;   // the default parameter runs whenever the argument is omitted — even if it is never needed
const lazy = (opts, fallback = buildLogger) => opts.logger ?? fallback();       // pass the thunk; call it only on the fallback path
const supplied = { logger: { level: "debug" } };
builds = 0; eager(supplied); const b1 = builds;
builds = 0; eagerArg(supplied); const b2 = builds;
builds = 0; lazy(supplied); const b3 = builds;
console.log(`builds: eager=${b1} defaultParam=${b2} thunk=${b3}`);
const getConfig = once(() => { builds++; return { port: 3000 }; });
builds = 0;
for (let i = 0; i < reads; i++) getConfig();
console.log(`once: reads=${reads} builds=${builds} sameObject=${getConfig() === getConfig()}`);
let computed = 0;
const report = { get total() { computed++; return Object.defineProperty(this, "total", { value: 42 }).total; } };   // replace the getter with the value on first read
for (let i = 0; i < reads; i++) report.total;
console.log(`lazyGetter: reads=${reads} computed=${computed} total=${report.total}`);
let evaluated = 0;
class LazyList {
  constructor(gen) { this.gen = gen; }
  static naturals() { return new LazyList(function* () { let i = 1; while (true) { evaluated++; yield i++; } }); }
  map(f) { const src = this.gen; return new LazyList(function* () { for (const x of src()) yield f(x); }); }
  filter(p) { const src = this.gen; return new LazyList(function* () { for (const x of src()) if (p(x)) yield x; }); }
  take(k) { const src = this.gen; return new LazyList(function* () { if (k <= 0) return; let i = 0; for (const x of src()) { yield x; if (++i === k) return; } }); }
  toArray() { return [...this.gen()]; }
}
const squaresOfOdds = LazyList.naturals().filter((x) => x % 2 === 1).map((x) => x * x);   // nothing has run yet
console.log(`beforeForce=${evaluated}`);
console.log(`first ${reads}: ${JSON.stringify(squaresOfOdds.take(reads).toArray())} evaluated=${evaluated}`);
