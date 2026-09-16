---
title: Implement the built-in — the reimplementation questions and the details that decide them
minutes: 14
---
"Implement `Promise.all`." "Write `bind`." "How would you implement `Array.prototype.reduce`?" These questions test whether you understand the semantics of things you use every day — not whether you can recite them. The trap is that the obvious ten-line version is wrong in ways the interviewer knows about: `bind` must work with `new`, `map` must skip holes, `reduce` must throw on an empty array without a seed, `Promise.all` must preserve order and reject on the first failure, `JSON.stringify` must drop `undefined` in objects but write `null` in arrays. This lesson lists the questions that recur, the spec details each one hinges on, and the shape of a correct answer; the exercises and the checkpoint have you write them.

## The recurring list

| Ask | The detail that decides it |
| --- | --- |
| `call`/`apply`/`bind` | Set `this` via a temporary symbol-keyed property (or `Reflect.apply`); `bind` pre-applies arguments and **is ignored as `this` when the bound function is called with `new`** — detect via `this instanceof bound` or `new.target` |
| `new` | Create an object whose prototype is `Ctor.prototype`, call `Ctor` with it as `this`, return the object **unless the constructor returned an object** |
| `instanceof` | Walk `Object.getPrototypeOf` from the value until `null`, comparing to `Ctor.prototype`; primitives are `false`; honour `Symbol.hasInstance` if asked |
| `Object.create` | An object with the given prototype (`null` allowed) plus optional descriptors |
| `Array.prototype.map/filter/forEach` | Iterate `0…length−1`, **skip holes** (`i in arr`), pass `(value, index, array)`, honour `thisArg`; `map` preserves length and holes |
| `reduce` | With no initial value start from the first *present* element; **throw `TypeError` on an empty array without a seed** |
| `flat(depth)` | Recursive with `depth − 1`, `Infinity` allowed, holes removed, `depth` default 1; `flatMap` is `map` then `flat(1)` |
| `includes` versus `indexOf` | `includes` uses SameValueZero (finds `NaN`); `indexOf` uses `===` (never finds `NaN`) |
| `Promise.all` | Result array **in input order**, resolve when the counter hits `length`, reject on the **first** rejection, non-promise inputs are wrapped (`Promise.resolve`), an empty input resolves `[]` immediately |
| `Promise.allSettled` / `race` / `any` | `allSettled` never rejects — `{status, value|reason}`; `race` settles with the first to settle; `any` rejects with an `AggregateError` only when all reject |
| A `Promise` class | State machine (pending → fulfilled/rejected, once); `then` returns a **new** promise; handlers run **asynchronously** (microtask) even when already settled; a handler's return value resolves the next promise, a thrown error rejects it, a returned thenable is **adopted** |
| `JSON.stringify` | `undefined`/functions/symbols are **omitted** as object values and become `null` in arrays; `NaN`/`Infinity` → `null`; `toJSON` honoured (Dates); strings escaped; cycles throw `TypeError`; replacer function/array and indent |
| `debounce`/`throttle` | Shared timer across calls; trailing versus leading; `cancel`; preserve `this` and arguments |
| `EventEmitter` | `on`/`off`/`once`/`emit`; copy the listener list before emitting so `off` during emit is safe |
| LRU cache | `Map` insertion order: delete + re-set on access; evict `map.keys().next().value` |
| `deepClone` | Primitives, arrays, plain objects, `Date`, `RegExp`, `Map`, `Set`; a `WeakMap` of seen objects for **cycles and shared references**; class instances lose their prototype unless you `Object.create(Object.getPrototypeOf(x))` |
| `deepEqual` | Same type; `NaN` equals `NaN`; arrays by length and elements; objects by own key sets; `Date` by time; `Map`/`Set` by entries; cycles via a visited pair set if asked |
| `curry`/`memoize`/`once`/`compose` | Arity via `fn.length`; memo keys for multiple arguments; `once` caches the first result |

## Worked shape: `bind`

```js
Function.prototype.myBind = function (thisArg, ...preset) {
  const target = this;
  function bound(...args) {
    // Called with `new`? Then `this` is the fresh instance and thisArg is ignored.
    const useNew = this instanceof bound;
    return target.apply(useNew ? this : thisArg, [...preset, ...args]);
  }
  bound.prototype = Object.create(target.prototype ?? null);   // so instanceof and `new` keep working
  return bound;
};
```

Interviewers probe exactly the `new` case and the partial-application case; mention both before they ask.

## Worked shape: `Promise.all`

```js
function all(iterable) {
  return new Promise((resolve, reject) => {
    const items = [...iterable];
    const results = new Array(items.length);
    let pending = items.length;
    if (pending === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value;                      // index, not push order
        if (--pending === 0) resolve(results);
      }, reject);                                // first rejection wins; later ones are ignored by the state machine
    });
  });
}
```

The two things people get wrong: pushing in completion order (breaks input order) and forgetting the empty case (never resolves).

## Worked shape: a `Promise`

```js
class MyPromise {
  #state = "pending"; #value; #handlers = [];
  constructor(executor) {
    const settle = (state) => (value) => { if (this.#state !== "pending") return; this.#state = state; this.#value = value; this.#handlers.forEach((h) => h()); this.#handlers = []; };
    try { executor(settle("fulfilled"), settle("rejected")); } catch (e) { settle("rejected")(e); }
  }
  then(onOk, onErr) {
    return new MyPromise((resolve, reject) => {
      const run = () => queueMicrotask(() => {                                        // always asynchronous
        const handler = this.#state === "fulfilled" ? onOk : onErr;
        if (typeof handler !== "function") return this.#state === "fulfilled" ? resolve(this.#value) : reject(this.#value);   // pass-through
        try { const out = handler(this.#value); out && typeof out.then === "function" ? out.then(resolve, reject) : resolve(out); }   // adopt thenables
        catch (e) { reject(e); }
      });
      this.#state === "pending" ? this.#handlers.push(run) : run();
    });
  }
  catch(onErr) { return this.then(undefined, onErr); }
}
```

The points that score: settling is one-shot; `then` returns a new promise; handlers run in a microtask even when the promise is already settled; a missing handler passes the value/reason through; returned thenables are adopted. `resolve(thenable)` inside the executor should adopt too — mention it if you skip it.

## Worked shape: `reduce` with holes and the empty case

```js
Array.prototype.myReduce = function (fn, ...seed) {
  let i = 0, acc;
  if (seed.length) acc = seed[0];
  else { while (i < this.length && !(i in this)) i++; if (i >= this.length) throw new TypeError("Reduce of empty array with no initial value"); acc = this[i++]; }
  for (; i < this.length; i++) if (i in this) acc = fn(acc, this[i], i, this);
  return acc;
};
```

Using rest for the seed distinguishes "no seed" from "seed is `undefined`" — the arity check the spec makes with `arguments.length`.

## How to answer these live

1. Say the contract first — what the built-in guarantees — in three or four bullets, including the edge case you know the interviewer is thinking of.
2. Write the simple path.
3. Add the edge cases one at a time, naming each ("now the `new` case").
4. Test with two calls: the normal one and the edge one.

If you do not know a detail, say what you would check ("I believe `map` skips holes; I'd confirm on MDN"). Guessing confidently and wrong is the worst outcome.

## Common mistakes

- `bind` that ignores `new`; `new` that ignores an object returned by the constructor.
- `map`/`filter` on `arr.length` without `i in arr`; `reduce` seeded with `undefined` instead of checking arity.
- `Promise.all` pushing in completion order or never resolving on `[]`; `then` that runs handlers synchronously.
- `JSON.stringify` writing `undefined` or leaving `NaN`; forgetting `toJSON`.
- `deepClone` without a seen-map (infinite recursion on cycles); `deepEqual` that fails on `NaN` or compares `Date`s by identity.

## What the interviewer is listening for

- Whether you state the contract before coding, and whether it includes the famous edge case.
- Whether the asynchronous ones stay asynchronous and one-shot.
- Whether the array ones respect holes, `thisArg` and the callback signature.
- Whether you test the edge case unprompted.

## Key takeaways

- The recurring reimplementation questions each hinge on one or two spec details — know the detail, not just the sketch.
- `bind` and `new`; `map` and holes; `reduce` and the empty array; `Promise.all` and order/empty; `then` and microtasks/adoption; `JSON.stringify` and `undefined`/`NaN`/`toJSON`/cycles.
- Answer in the order contract → simple path → edge cases named one by one → two tests.
- Say what you would verify rather than guessing a detail.
