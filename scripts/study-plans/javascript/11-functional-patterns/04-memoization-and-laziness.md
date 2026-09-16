---
title: Memoization and laziness — computing once, and only when asked
minutes: 12
---
Purity makes two optimisations legal that impure code cannot have: **memoization** — remember a function's result for given arguments and return it next time — and **laziness** — do not compute a value until something needs it, then perhaps never. Both are old ideas; JavaScript makes them small: a `Map` and a wrapper function, a thunk or a generator. Both also have failure modes that look like success (a cache that grows forever, a key function that collides, a "lazy" pipeline that is forced immediately). This lesson covers the generic `memoize` and its knobs, memoized recursion as dynamic programming, `once`, lazy values and sequences, and the rules for when caching costs more than it saves.

## `memoize`

```js
function memoize(fn, { key = (...args) => JSON.stringify(args), cache = new Map() } = {}) {
  const wrapped = (...args) => {
    const k = key(...args);
    if (cache.has(k)) { wrapped.hits++; return cache.get(k); }
    wrapped.misses++;
    const value = fn(...args);
    cache.set(k, value);
    return value;
  };
  wrapped.hits = 0; wrapped.misses = 0; wrapped.cache = cache;
  return wrapped;
}
```

Three design points hide in those lines:

- **The key.** Arguments must become a Map key. Primitives: use the value itself (`key: (x) => x`) — fastest and exact. Several primitives or plain data: `JSON.stringify(args)` works but is slow-ish, and collides for values JSON cannot distinguish (`undefined` vs missing, `NaN`, `-0`, key order in objects). Objects by identity: use the object as the key in a **`WeakMap`** (module 6) so the cache does not pin them. Never key on `String(obj)` (`[object Object]` for everything).
- **The store.** A `Map` grows forever — a memoized function called with a million distinct inputs holds a million entries. Bound it: an **LRU** (module 6's checkpoint) or a TTL; or accept unbounded growth only for functions with a small finite domain.
- **What is cached.** Only results that are stable: pure functions, or impure ones whose results you deliberately want frozen for the process lifetime (a config parse). Caching a promise (`memoize(fetchUser)`) dedupes concurrent calls — but a rejected promise stays cached too unless you evict it in a `catch`.

## Memoized recursion is dynamic programming

```js
const fib = memoize((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2)), { key: (n) => n });
fib(50);        // 12586269025 — 99 calls instead of ~40 billion
```

The naive recursion recomputes the same subproblems exponentially many times; the memo turns the call tree into a table filled once per distinct argument — exactly what a dynamic-programming solution does with an explicit array. Any recursion with **overlapping subproblems** and a **small argument space** (grid paths, edit distance, coin change, longest common subsequence) benefits. The recursive call must go through the *memoized* name (`fib`, not the inner function), or the inner calls bypass the cache. The recursion depth still counts against the stack; for very large `n` fill a table iteratively.

## `once`

```js
const once = (fn) => { let called = false, result; return (...args) => (called ? result : ((called = true), (result = fn(...args)))); };
const getConfig = once(() => JSON.parse(fs.readFileSync("config.json", "utf8")));
```

Memoization with a single slot and no key — for initialisation that must run exactly once (reading config, creating a connection pool, registering handlers). The lazy variant of a module-level constant: the work happens on the first call, not at import time, so importing the module stays cheap and side-effect-free.

## Laziness: thunks and lazy values

A **thunk** is a zero-argument function standing for a computation not yet performed: `const value = () => expensive()`. Pass thunks where a value might not be needed — a default that is expensive to build (`opts.logger ?? makeLogger()` computes the logger even when `opts.logger` exists; `opts.logger ?? makeLogger` with a call at the use site does not), a message that is only formatted when the log level is enabled, the branches of a custom control-flow function. Combine with `once` for a **lazy value**: computed on first read, cached thereafter — a getter that does `this._v ??= compute()` is the same idea inside a class.

## Lazy sequences

Generators (module 6) are lazy sequences: `take(5, map(f, filter(p, naturals())))` computes exactly five results. The pattern generalises: a `LazyList` object with `map`/`filter`/`take` methods that each return another lazy object and a terminal `toArray()`/`forEach()` that pulls — the shape of Java streams, Rust iterators and Node 22's iterator helpers. Laziness pays when the source is infinite or expensive per element, when only a prefix is consumed, or when intermediate arrays would be large. It costs a closure or generator step per element; on a 20-element array, `arr.filter(p).map(f)` is faster and clearer.

## Forcing, and the trap

Laziness is only useful if something *stays* unevaluated. `[...lazySeq]`, `Array.from`, `Promise.all`, `JSON.stringify` and a debugger's inspection all **force** the whole thing. A lazy pipeline over an infinite source that is spread by accident hangs; a lazy value whose thunk captures a variable that later changes computes with the later value (a closure-over-loop-variable style bug). Make forcing explicit — one `toArray()` or `take(n)` at the end — and keep thunks pure.

## When caching costs more than it saves

- The function is already cheap (a property read, a small arithmetic) — key computation and Map lookup cost more.
- Arguments are rarely repeated (unique ids, timestamps) — every call is a miss plus a store.
- Results are large and inputs are many — memory balloons; bound the cache.
- The function is impure and its inputs do not capture what it depends on — the cache returns stale data (memoizing `getUser(id)` when users change).
- Object arguments keyed by `JSON.stringify` — slow and collision-prone; key by identity or by a chosen field.

Measure: hit rate and time saved against memory held. React's `useMemo`/`memo` are memoization with a one-slot cache keyed by dependency identity — the same trade-offs apply.

## Common mistakes

- Unbounded caches in long-running processes.
- Keys that collide (`String(obj)`, `JSON.stringify` with key-order differences) or that are slower than the function.
- Recursive calls that bypass the memoized wrapper.
- Caching rejected promises; caching results of impure functions without an invalidation story.
- Spreading a lazy or infinite sequence; thunks capturing mutable variables.
- Memoizing everything by reflex.

## Interview angle

- *"Implement `memoize`."* A wrapper with a `Map` from key to result; return the cached value on a hit; discuss the key function and bounding the cache.
- *"How does memoization relate to dynamic programming?"* Memoized recursion fills the DP table on demand; same complexity, different order.
- *"How do you memoize a function taking objects?"* Key by identity with a `WeakMap`, or by a stable id — not `JSON.stringify`.
- *"What is a thunk?"* A zero-argument function representing a deferred computation; the unit of laziness.
- *"When should you not memoize?"* Cheap functions, rarely repeated arguments, large results, impure functions, unbounded input domains.

## Key takeaways

- `memoize` = key function + cache + wrapper; primitives keyed directly, objects by `WeakMap` identity; bound the cache (LRU/TTL).
- Memoized recursion is dynamic programming; recurse through the memoized name; watch stack depth.
- `once` for run-exactly-once initialisation; thunks for deferred computation; lazy values combine both.
- Generators give lazy sequences; force explicitly with `take`/`toArray`; never spread the infinite.
- Cache only pure (or deliberately frozen) results with repeated inputs; measure hit rate versus memory.
