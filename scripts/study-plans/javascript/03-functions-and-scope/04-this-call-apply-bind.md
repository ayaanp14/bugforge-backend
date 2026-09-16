---
title: this — the five binding rules, call, apply and bind
minutes: 15
---
`this` is the most misunderstood word in JavaScript because it is the one thing *not* decided lexically: its value depends on **how a function is called**, not where it was written — with the exception of arrow functions, which have no `this` of their own and borrow the enclosing one. There are exactly five rules, applied in order of precedence, and once you know them every "why is `this` undefined in my callback" has a one-line answer. This lesson states the rules, shows the classic loss of `this`, and covers the three methods — `call`, `apply`, `bind` — that set it explicitly.

## The five rules, highest precedence first

1. **Arrow function** — no own `this`; uses the `this` of the enclosing scope at the time the arrow was *created*. Nothing can change it, not even `bind`.
2. **`new`** — `new F()` creates a fresh object and binds `this` to it for the duration of `F`.
3. **Explicit binding** — `f.call(obj, …)`, `f.apply(obj, […])`, and a function produced by `f.bind(obj)`: `this` is `obj`.
4. **Method call** — `obj.method()`: `this` is the object before the dot (the *receiver*), whatever object that is at the call.
5. **Plain call** — `f()`: `this` is `undefined` in strict mode (the global object in sloppy mode).

```js
"use strict";
const user = {
  name: "Ada",
  hello() { return `hi from ${this.name}`; },
  later() { setTimeout(function () { console.log(this); }, 0); }        // plain call inside → undefined
};
user.hello();                 // "hi from Ada"        — rule 4
const f = user.hello;
f();                          // TypeError: Cannot read properties of undefined  — rule 5
f.call({ name: "Bo" });       // "hi from Bo"         — rule 3
```

The dot decides. Detach the method from the object and the receiver is gone.

## Losing `this`, and the three fixes

The classic: passing a method as a callback.

```js
class Counter {
  count = 0;
  increment() { this.count++; }
}
const c = new Counter();
setTimeout(c.increment, 0);          // called as a plain function → this is undefined → TypeError
button.addEventListener("click", c.increment);   // this would be the button, not c
```

Fixes, in order of preference:

```js
setTimeout(() => c.increment(), 0);              // 1. wrap in an arrow: the dot call is preserved
setTimeout(c.increment.bind(c), 0);              // 2. bind: a new function with this fixed to c
class Counter { increment = () => { this.count++; }; }   // 3. arrow class field: this is the instance forever
```

The arrow class field (rule 1 inside a constructor context) is the modern idiom for methods used as callbacks — React components used it for years. Its cost: one function object per instance instead of one shared method on the prototype.

## `call`, `apply`, `bind`

```js
function describe(prefix, suffix) { return `${prefix}${this.name}${suffix}`; }
const cat = { name: "Tom" };
describe.call(cat, "<", ">");         // "<Tom>"   — arguments listed
describe.apply(cat, ["<", ">"]);      // "<Tom>"   — arguments as an array (spread made apply mostly obsolete)
const tagTom = describe.bind(cat, "["); // this = cat, prefix = "[" fixed
tagTom("]");                          // "[Tom]"
```

`bind` returns a **new** function with `this` (and optionally leading arguments — partial application) permanently set; calling `bind` again on it does not rebind. `call`/`apply` invoke immediately. Modern uses: `bind` for callbacks and event handlers, `call` for borrowing methods (`Array.prototype.slice.call(arguments)` in old code; `Object.prototype.hasOwnProperty.call(obj, key)` still common), `apply` almost never now that `Math.max(...arr)` exists.

## `this` in arrows, carefully

An arrow's `this` is whatever `this` was where the arrow was written:

```js
const obj = {
  name: "X",
  regular() { return [1].map(function () { return this; }); },   // [undefined] — plain call inside map
  arrow() { return [1].map(() => this.name); },                  // ["X"] — arrow borrows obj's this
  wrong: () => this,                                             // arrow AT object-literal level: this is the module's this — not obj
};
```

Rule of thumb: **arrows for callbacks inside methods; regular functions (or method shorthand) for the methods themselves.** An arrow defined as an object-literal property does not see the object.

## `this` at the top level and in modules

In a CommonJS file, top-level `this` is `module.exports`; in an ES module it is `undefined`; in a browser script it is `window`. Inside a plain function in strict mode it is `undefined`. None of these are useful — treat top-level `this` as something never to reference.

## `this` in classes and constructors

```js
function Person(name) { this.name = name; }            // rule 2 with new: this is the new object
const p = new Person("Ada");
Person("Bo");                                          // rule 5 without new: TypeError in strict mode (this is undefined)

class Point { constructor(x, y) { this.x = x; this.y = y; } dist() { return Math.hypot(this.x, this.y); } }
```

Class constructors throw if called without `new` — one of the reasons `class` replaced constructor functions. Inside methods, rule 4 applies as usual, and losing `this` when passing `p.dist` around is the same problem with the same three fixes.

## `globalThis`, and why `this` is not for globals

If you need the global object, write `globalThis`; never `this` at top level (it differs by environment). The sloppy-mode rule that made plain-call `this` the global object is the reason old code accidentally created global variables from inside functions.

## A method for reading any `this`

1. Is the function an arrow? Take the enclosing scope's `this` at definition.
2. Was it called with `new`? The new object.
3. `call`/`apply`/`bind`? The given object.
4. Called as `something.f()`? `something`.
5. Otherwise `undefined` (strict).

Run the list on any snippet and the answer falls out.

## Interview angle

- *"How is `this` determined?"* By the call: `new` → new object; explicit `call`/`apply`/`bind` → given object; method call → receiver; plain call → `undefined` in strict mode; arrows inherit lexically and cannot be rebound.
- *"Why is `this` undefined in my callback?"* The method was passed and later called as a plain function; wrap in an arrow, `bind` it, or use an arrow class field.
- *"`call` versus `apply` versus `bind`?"* Immediate with listed args; immediate with an array; returns a new bound function.
- *"Can you `bind` an arrow function?"* No effect on `this` — arrows have none of their own.
- *"What is `this` in an arrow defined inside a method?"* The method's `this` — that is the whole point of using an arrow there.

## Key takeaways

- Five rules by precedence: arrow (lexical) → `new` → `call`/`apply`/`bind` → receiver of the dot → `undefined`.
- Detaching a method loses its receiver; fix with an arrow wrapper, `bind`, or an arrow class field.
- `bind` fixes `this` (and leading arguments) permanently; `call`/`apply` invoke now.
- Arrows inside methods are right; arrows *as* methods are wrong.
- Never rely on top-level `this`; use `globalThis` for the global object.
