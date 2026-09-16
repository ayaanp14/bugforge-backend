"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Implement MyPromise: one-shot settlement, then/catch/finally returning new promises, handlers always asynchronous (queueMicrotask),
// adoption of thenables (returned from handlers and passed to resolve), and the statics resolve/reject/all/allSettled/race/any.
// Input: scenario names — chain adopt reject order all allSettled race any
class MyPromise {
  #state = "pending"; #value; #handlers = [];
  constructor(executor) {
    const settle = (state, value) => { if (this.#state !== "pending") return; this.#state = state; this.#value = value; const hs = this.#handlers; this.#handlers = []; hs.forEach((h) => h()); };   // one-shot
    const doResolve = (value) => {
      if (value === this) return settle("rejected", new TypeError("Chaining cycle detected for promise"));
      const thenable = value !== null && (typeof value === "object" || typeof value === "function") && typeof value.then === "function";
      if (!thenable) return settle("fulfilled", value);
      let once = false;                                                        // a misbehaving thenable may call both or twice
      try { value.then((v) => { if (!once) { once = true; doResolve(v); } }, (r) => { if (!once) { once = true; settle("rejected", r); } }); }
      catch (e) { if (!once) { once = true; settle("rejected", e); } }
    };
    let called = false;
    try { executor((v) => { if (!called) { called = true; doResolve(v); } }, (r) => { if (!called) { called = true; settle("rejected", r); } }); }
    catch (e) { if (!called) { called = true; settle("rejected", e); } }
  }
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const run = () => queueMicrotask(() => {                                 // asynchronous even when already settled
        const handler = this.#state === "fulfilled" ? onFulfilled : onRejected;
        if (typeof handler !== "function") return this.#state === "fulfilled" ? resolve(this.#value) : reject(this.#value);   // pass-through
        try { resolve(handler(this.#value)); } catch (e) { reject(e); }        // resolve adopts a returned thenable
      });
      this.#state === "pending" ? this.#handlers.push(run) : run();
    });
  }
  catch(onRejected) { return this.then(undefined, onRejected); }
  finally(onFinally) { return this.then((v) => MyPromise.resolve(onFinally()).then(() => v), (r) => MyPromise.resolve(onFinally()).then(() => { throw r; })); }
  static resolve(v) { return v instanceof MyPromise ? v : new MyPromise((res) => res(v)); }
  static reject(r) { return new MyPromise((_, rej) => rej(r)); }
  static all(items) { return new MyPromise((resolve, reject) => { const arr = [...items], results = new Array(arr.length); let pending = arr.length; if (!pending) return resolve(results); arr.forEach((item, i) => MyPromise.resolve(item).then((v) => { results[i] = v; if (--pending === 0) resolve(results); }, reject)); }); }
  static allSettled(items) { return MyPromise.all([...items].map((item) => MyPromise.resolve(item).then((value) => ({ status: "fulfilled", value }), (reason) => ({ status: "rejected", reason })))); }
  static race(items) { return new MyPromise((resolve, reject) => { for (const item of items) MyPromise.resolve(item).then(resolve, reject); }); }
  static any(items) { return new MyPromise((resolve, reject) => { const arr = [...items], errors = new Array(arr.length); let pending = arr.length; if (!pending) return reject(new AggregateError(errors, "All promises were rejected")); arr.forEach((item, i) => MyPromise.resolve(item).then(resolve, (r) => { errors[i] = r; if (--pending === 0) reject(new AggregateError(errors, "All promises were rejected")); })); }); }
}
const log = (scenario, msg) => console.log(`[${scenario}] ${msg}`);
const toNative = (p) => new Promise((res) => p.then((v) => res(`fulfilled ${JSON.stringify(v)}`), (r) => res(`rejected ${r instanceof Error ? r.name + ": " + r.message : JSON.stringify(r)}`)));   // the driver waits on a native promise
const order = [];
const delay = (ms, value, fail = false) => new MyPromise((res, rej) => setTimeout(() => { order.push(value); (fail ? rej : res)(fail ? new Error(value) : value); }, ms));
const scenarios = {
  async chain() {
    log("chain", await toNative(MyPromise.resolve(1).then((v) => v + 1).then((v) => { log("chain", `step ${v}`); return v * 10; }).then((v) => { log("chain", `step ${v}`); })));
    log("chain", await toNative(MyPromise.resolve("x").then(undefined, undefined).then()));   // missing handlers pass the value through
  },
  async adopt() {
    log("adopt", await toNative(MyPromise.resolve(1).then((v) => delay(10, v + 1)).then((v) => ({ then(res) { res(v * 100); } })).then((v) => Promise.resolve(v + 1))));   // MyPromise, plain thenable, native Promise
    log("adopt", await toNative(new MyPromise((res) => res(MyPromise.resolve("adopted in executor")))));
    log("adopt", await toNative(new MyPromise((res) => res(MyPromise.reject(new Error("adopted rejection"))))));
  },
  async reject() {
    log("reject", await toNative(new MyPromise((_, rej) => rej(new Error("boom"))).then(() => log("reject", "skipped")).catch((e) => { log("reject", `caught ${e.message}`); return "recovered"; }).finally(() => log("reject", "finally ran")).then((v) => `after ${v}`)));
    log("reject", await toNative(MyPromise.resolve().then(() => { throw new RangeError("bad"); }).then(() => log("reject", "skipped")).catch((e) => `caught ${e.name}`)));
    log("reject", await toNative(new MyPromise(() => { throw new Error("executor threw"); })));
    log("reject", await toNative(MyPromise.reject("plain value").finally(() => {})));   // finally keeps the reason
  },
  async order() {
    log("order", "sync 1");
    const p = MyPromise.resolve("x");
    p.then(() => log("order", "then on a settled promise"));
    queueMicrotask(() => log("order", "queueMicrotask registered after"));
    log("order", "sync 2 (then already registered)");
    await toNative(p);
  },
  async all() {
    order.length = 0;
    log("all", `${await toNative(MyPromise.all([delay(30, "a"), delay(10, "b"), delay(20, "c")]))} settledOrder=${order.join(",")}`);   // results keep input order
    log("all", await toNative(MyPromise.all([1, MyPromise.resolve(2), Promise.resolve(3)])));
    log("all", await toNative(MyPromise.all([])));
    order.length = 0;
    const out = await toNative(MyPromise.all([delay(60, "slow"), delay(10, "fast-fail", true)]));
    log("all", `${out} settledSoFar=${order.join(",")} (rejected before the slow task finished)`);
  },
  async allSettled() {
    log("allSettled", await toNative(MyPromise.allSettled([delay(20, "a"), delay(10, "b", true), 3]).then((rs) => rs.map((r) => (r.status === "fulfilled" ? `fulfilled:${r.value}` : `rejected:${r.reason.message}`)))));
    log("allSettled", await toNative(MyPromise.allSettled([])));
  },
  async race() {
    log("race", await toNative(MyPromise.race([delay(30, "slow"), delay(10, "fast", true)])));
    log("race", await toNative(MyPromise.race([delay(30, "slow"), "immediate"])));
    MyPromise.race([]).then(() => log("race", "never"));
    log("race", "race([]) stays pending forever");
  },
  async any() {
    log("any", await toNative(MyPromise.any([delay(20, "a", true), delay(10, "b", true), delay(30, "c")])));
    log("any", await toNative(MyPromise.any([delay(10, "x", true), delay(20, "y", true)]).catch((e) => `${e.name}: ${e.message} [${e.errors.map((x) => x.message).join(",")}]`)));
    log("any", await toNative(MyPromise.any([]).catch((e) => `${e.name} with ${e.errors.length} errors`)));
  },
};
(async () => {
  for (const name of lines.map((l) => l.trim())) {
    if (!scenarios[name]) { console.log(`?? unknown scenario ${name}`); continue; }
    await scenarios[name]();
  }
})();
