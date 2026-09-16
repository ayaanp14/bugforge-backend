"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Implement myCall, myApply, myBind (partial application AND `new` support), myNew (honour an object returned by the constructor) and myInstanceOf (walk the prototype chain).
// Input: check names, or `all`. Checks: call apply bind-partial bind-this bind-new new-plain new-returns-object instanceof
Function.prototype.myCall = function (thisArg, ...args) {
  const ctx = thisArg == null ? globalThis : Object(thisArg);                 // primitives are boxed, like sloppy-mode call
  const key = Symbol("fn");
  ctx[key] = this;
  try { return ctx[key](...args); } finally { delete ctx[key]; }              // a method call on ctx binds `this` to ctx
};
Function.prototype.myApply = function (thisArg, args = []) { return this.myCall(thisArg, ...args); };
Function.prototype.myBind = function (thisArg, ...preset) {
  const target = this;
  function bound(...args) { return target.myApply(this instanceof bound ? this : thisArg, [...preset, ...args]); }   // `new bound()` ignores thisArg
  bound.prototype = Object.create(target.prototype ?? null);
  return bound;
};
function myNew(Ctor, ...args) {
  const obj = Object.create(Ctor.prototype);
  const out = Ctor.apply(obj, args);
  return out !== null && (typeof out === "object" || typeof out === "function") ? out : obj;   // an object returned by the constructor replaces `this`
}
function myInstanceOf(value, Ctor) {
  if (value === null || (typeof value !== "object" && typeof value !== "function")) return false;
  for (let p = Object.getPrototypeOf(value); p !== null; p = Object.getPrototypeOf(p)) if (p === Ctor.prototype) return true;
  return false;
}
function greet(greeting, punct) { return `${greeting}, ${this.name}${punct}`; }
function add(a, b) { return a + b; }
function Point(x, y) { this.x = x; this.y = y; }
Point.prototype.sum = function () { return this.x + this.y; };
function Weird() { this.ignored = true; return { custom: true }; }
class Animal {} class Dog extends Animal {}
const checks = {
  call() { const mine = greet.myCall({ name: "Ada" }, "hi", "!"), native = greet.call({ name: "Ada" }, "hi", "!"); return [`${mine}`, mine === native]; },
  apply() { const mine = Math.max.myApply(null, [3, 9, 2]), native = Math.max.apply(null, [3, 9, 2]); return [`${mine}`, mine === native]; },
  "bind-partial"() { const mine = add.myBind(null, 10)(5), native = add.bind(null, 10)(5); return [`add(10)(5)=${mine}`, mine === native]; },
  "bind-this"() { const counter = { n: 0, inc() { return ++this.n; } }; const f = counter.inc.myBind(counter); f(); const mine = f(); return [`n=${mine}`, mine === 2]; },
  "bind-new"() { const Bound = Point.myBind({ ignored: true }, 1); const p = new Bound(2); const q = new (Point.bind({ ignored: true }, 1))(2); return [`{x:${p.x},y:${p.y}} instanceof Point=${p instanceof Point} sum=${p.sum()}`, p.x === q.x && p.y === q.y && p instanceof Point && !("ignored" in p)]; },
  "new-plain"() { const p = myNew(Point, 1, 2), q = new Point(1, 2); return [`{x:${p.x},y:${p.y}} sum=${p.sum()}`, JSON.stringify(p) === JSON.stringify(q) && Object.getPrototypeOf(p) === Point.prototype]; },
  "new-returns-object"() { const w = myNew(Weird), n = new Weird(); return [`${JSON.stringify(w)}`, JSON.stringify(w) === JSON.stringify(n) && !("ignored" in w)]; },
  instanceof() { const d = new Dog(); const pairs = [[d, Dog], [d, Animal], [d, Object], [d, Array], [[], Object], [5, Number], [null, Object], [Object.create(null), Object]];
    const mine = pairs.map(([v, C]) => myInstanceOf(v, C)), native = pairs.map(([v, C]) => v instanceof C);
    return [`dog->Dog,Animal,Object,Array | [],5,null,nullProto->Object = ${mine.join(",")}`, mine.every((m, i) => m === native[i])]; },
};
const wanted = lines.map((l) => l.trim()).includes("all") ? Object.keys(checks) : lines.map((l) => l.trim());
let pass = 0;
for (const name of wanted) {
  if (!checks[name]) { console.log(`?? ${name}: unknown check`); continue; }
  const [detail, ok] = checks[name]();
  if (ok) pass++;
  console.log(`${ok ? "ok" : "FAIL"} ${name}: ${detail} match=${ok}`);
}
console.log(`${pass}/${wanted.length} match the native behaviour`);
