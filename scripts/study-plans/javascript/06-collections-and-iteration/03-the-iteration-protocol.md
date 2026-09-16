---
title: The iteration protocol — what for…of, spread and destructuring actually call
minutes: 13
---
`for…of`, `[...x]`, `const [a, b] = x`, `Array.from(x)`, `new Map(x)`, `Promise.all(x)`, `yield*` — every one of these works on *any* object that follows one small contract, the **iteration protocol**. Arrays, strings, Maps, Sets, `arguments`, typed arrays, DOM lists and generator objects follow it; plain objects do not, which is why `for (const x of {a: 1})` throws. Implement the contract on your own class and all of that syntax works on it for free. This lesson states the protocol precisely, shows a hand-written iterator, and covers the details that matter in practice: laziness, early exit, and what is and is not iterable.

## Two interfaces

An object is **iterable** if it has a method under the key `Symbol.iterator` that returns an **iterator**. An iterator is any object with a `next()` method returning `{ value, done }`:

```js
const iterable = {
  from: 1, to: 3,
  [Symbol.iterator]() {                     // called once per loop
    let current = this.from, last = this.to;
    return {                                // the iterator — fresh state per loop
      next() {
        return current <= last ? { value: current++, done: false } : { value: undefined, done: true };
      },
    };
  },
};
[...iterable];                 // [1, 2, 3]
for (const n of iterable) { }  // 1, 2, 3
const [first] = iterable;      // 1
Math.max(...iterable);         // 3
```

`for…of` does exactly: call `x[Symbol.iterator]()`, then call `next()` repeatedly, binding `value` until `done` is `true`. The `value` on the final `done: true` result is ignored by `for…of` and spread (it is the *return value*, visible only to `yield*` and manual callers). Because the iterator is created per loop, you can iterate the same iterable many times and each loop starts fresh — as long as `[Symbol.iterator]` returns a **new** iterator each call.

## Iterators are often iterable too

The iterator objects the built-ins hand back (`arr.values()`, `map.entries()`, generator objects) also have a `[Symbol.iterator]` that returns `this`, so you can pass them straight to `for…of` — but they are **single-use**: once exhausted, a second loop sees nothing. `const it = m.keys(); [...it]; [...it]` gives the keys and then `[]`. An *iterable* (the Map) restarts; an *iterator* (the result of `keys()`) does not.

## Manual iteration

```js
const it = "hi"[Symbol.iterator]();
it.next();   // { value: "h", done: false }
it.next();   // { value: "i", done: false }
it.next();   // { value: undefined, done: true }
```

Manual `next()` is how you pull *some* of a sequence — the first item and then the rest through a different path, or two iterators zipped in lockstep, or a parser that reads one token ahead. Everything higher-level is built from this.

## What is iterable

Iterable: `Array`, `String` (by **code point**, so emoji are one item — module 10), `Map`, `Set`, `arguments`, typed arrays, `NodeList`/`HTMLCollection` in browsers, generator objects, the results of `keys()/values()/entries()`. **Not** iterable: plain objects (use `Object.entries(obj)` — an array of pairs, which is), numbers, `null`/`undefined` (spreading either into an array throws; spreading into an *object* does not). `Array.from(x)` accepts iterables **and** array-likes (objects with `length` and indices), which is why it works on `{ length: 3 }` where spread does not.

## Laziness and early exit

Values are produced **on demand**: `next()` computes the next one only when asked. An iterator over a file, a database cursor, or an infinite sequence is fine as long as consumers stop. `for…of` stops when you `break`, `return` or `throw` — and then calls the iterator's optional **`return()`** method so it can release resources (close the file, clear a timer). Destructuring a prefix (`const [a, b] = it`) also calls `return()`. Spread and `Array.from` consume everything — never spread an infinite iterator.

```js
function* watched() { try { yield 1; yield 2; yield 3; } finally { console.log("cleanup"); } }
for (const v of watched()) { if (v === 2) break; }   // logs "cleanup" — break triggered return()
```

## Iterables in your own classes

```js
class Playlist {
  #tracks = [];
  add(t) { this.#tracks.push(t); return this; }
  [Symbol.iterator]() { return this.#tracks[Symbol.iterator](); }    // delegate to the array's iterator
  *shuffled() { /* a generator method — next lesson */ }
}
for (const t of new Playlist().add("a").add("b")) { }
```

Delegating to an inner array's iterator is the one-liner; when the sequence is computed (a tree walk, a range, a filtered view) write the iterator by hand or, far more readably, as a generator — the whole next lesson. Exposing iteration rather than the underlying array keeps the array private and lets you change the storage later.

## Consumers you already use

`Array.from(it, mapFn)`, `new Set(it)`, `new Map(pairs)`, `Object.fromEntries(pairs)`, `Promise.all(it)`, `Math.max(...it)`, `fn(...it)`, `[...it]`, `const [a, ...rest] = it`, `yield* it`, `for await (const x of asyncIt)`. Node 22's iterator helpers (`it.map().filter().take()`) do not exist on Node 16 — write generators for the same effect.

## Common mistakes

- Returning `this` from `[Symbol.iterator]` with state stored on the iterable — the second loop finds it exhausted.
- Spreading a plain object into an array, or a Map into `Object.fromEntries` without checking the keys are strings.
- Forgetting that `String` iterates by code point while `.length` and indexing are by UTF-16 unit.
- Spreading a possibly-infinite or huge iterator.
- Holding an iterator across `break` without letting `return()` run (only a problem when you call `next()` by hand — then call `it.return?.()` yourself).

## Interview angle

- *"What makes an object iterable?"* A `[Symbol.iterator]()` method returning an object with `next()` → `{ value, done }`.
- *"Iterable versus iterator?"* Iterable produces iterators (restartable); an iterator is the cursor (single-use); built-in iterators are also iterable by returning themselves.
- *"Why can't you `for…of` an object?"* No `Symbol.iterator`; use `Object.entries`.
- *"What happens on `break` inside `for…of`?"* The iterator's `return()` is called so it can clean up.
- *"Make a class work with spread and `for…of`."* Implement `[Symbol.iterator]`, usually by delegating or with a generator.

## Key takeaways

- Iterable = has `[Symbol.iterator]()`; iterator = has `next()` returning `{ value, done }`; the protocol is what `for…of`, spread, destructuring and `Array.from` call.
- Return a fresh iterator per call so loops restart; built-in iterators are single-use.
- Strings iterate by code point; plain objects are not iterable; `Array.from` also takes array-likes.
- Iteration is lazy; `break` calls `return()`; never spread the infinite.
- Own classes: delegate to an inner iterator or write a generator.
