---
title: WeakMap, WeakSet and WeakRef — data that does not keep objects alive
minutes: 11
---
A `Map` holds its keys strongly: as long as the map exists, every key object stays in memory even if nothing else refers to it. That is what you want for a cache keyed by ids and exactly what you do not want for "extra data about *this* object" — a DOM node's handlers, a parsed result for a request object, a per-instance secret. `WeakMap` and `WeakSet` hold keys **weakly**: when the key object becomes unreachable elsewhere, the entry disappears with it, and no leak accumulates. `WeakRef` and `FinalizationRegistry` (2021) expose the same idea for single references. This lesson covers what the weak collections can and cannot do, the three patterns they exist for, and why you will rarely reach for `WeakRef`.

## WeakMap

```js
const meta = new WeakMap();
function tag(obj, info) { meta.set(obj, info); }
function infoOf(obj) { return meta.get(obj); }

let node = { id: 1 };
tag(node, { visits: 3 });
infoOf(node);          // { visits: 3 } — node itself is untouched: no new property, Object.keys(node) is ["id"]
node = null;           // nothing else holds the object → the entry is collectable; no cleanup code needed
```

Rules that follow from "weak":

- **Keys must be objects** (or non-registered symbols since 2023; on Node 16, objects only). `meta.set("str", 1)` throws `TypeError: Invalid value used as weak map key` — a primitive cannot be "unreachable", so weak semantics make no sense for it.
- **Not iterable, no `size`, no `clear`, no `keys()`.** If you could list the keys, the collector could never remove one without the program observing it; the API is `get`/`set`/`has`/`delete` and nothing else.
- Values are held strongly *while the key lives*. A value that references its own key keeps nothing alive beyond the key's own lifetime — the engine handles ephemeron cycles.

## The three patterns

**1. Metadata on objects you do not own.** Framework state for DOM nodes, parsed bodies for request objects, memoised results keyed by the input object — anywhere a `Map` would pin objects forever and a property on the object would be intrusive or impossible (frozen objects, host objects).

**2. Private data before `#fields`** — and still, for data private *across* classes or modules:

```js
const secrets = new WeakMap();
class User {
  constructor(name, hash) { this.name = name; secrets.set(this, hash); }
  check(hash) { return secrets.get(this) === hash; }
}
```

Only code with access to `secrets` can read the hash. `#fields` (module 5) cover the in-class case more directly; the WeakMap form still wins when several modules cooperate or when you must attach private data to instances of a class you did not write.

**3. Memoisation keyed by object identity.**

```js
const cache = new WeakMap();
function expensive(obj) {
  if (!cache.has(obj)) cache.set(obj, compute(obj));
  return cache.get(obj);
}
```

Same object → same result, computed once; when the caller drops the object, the cached result goes too. A `Map` here is a slow leak in any long-running process.

## WeakSet

A set of objects with `add`/`has`/`delete` only. Used for "have I seen/processed this object": marking visited nodes in a traversal over objects you do not own, tracking instances that passed a check (`brandChecks.add(this)` in a constructor, `has(obj)` later), preventing double initialisation. No iteration, no size — if you need to *list* them, you need a `Set` and you accept the pinning.

## WeakRef and FinalizationRegistry

```js
let big = loadHuge();
const ref = new WeakRef(big);
big = null;
ref.deref();          // the object — or undefined once it has been collected
```

`WeakRef` lets you hold something *without* keeping it alive and check later whether it is still there. `FinalizationRegistry` lets you register a callback that runs *some time after* an object is collected (`registry.register(obj, heldValue)`). Both are deliberately non-deterministic: when collection happens is up to the engine, `deref()` results are stable only within one synchronous job, and a finaliser may run late or never (process exit). The spec's own advice is to avoid them where possible. Legitimate uses are rare and infrastructural: caches of large recomputable objects (images, parsed ASTs) that may be dropped under memory pressure, and releasing *external* resources (a WASM handle, a file descriptor in a native binding) when the JS wrapper is gone — as a backstop, never as the primary cleanup.

## Why you cannot observe collection

Garbage collection is not part of the language's observable semantics: no `gc()` call, no event, no "collected" flag. Tests that try to prove a WeakMap entry vanished need `node --expose-gc` and are flaky by nature; the correct test is that the object graph *allows* collection (nothing strong refers to the key). Reason about reachability, not timing.

## Common mistakes

- Using a `Map` keyed by objects for per-object data in a long-lived process — a leak that grows for the life of the server.
- Trying to iterate a WeakMap or read its size, then reaching for a Map plus manual deletes (which is a leak again if a delete is missed).
- Primitive keys in a WeakMap.
- `WeakRef` for ordinary caching because it "sounds efficient" — behaviour becomes GC-dependent and hard to test; an LRU `Map` with a size cap is predictable.
- Relying on `FinalizationRegistry` for cleanup that must happen (closing a connection).

## Interview angle

- *"WeakMap versus Map?"* Weak keys (objects only) that do not prevent collection; no iteration or size; for metadata, private data and identity-keyed memoisation without leaks.
- *"Why can't you iterate a WeakMap?"* Listing keys would make collection observable; the design forbids it.
- *"How would you attach data to a DOM node without a property?"* A WeakMap keyed by the node.
- *"When is `WeakRef` appropriate?"* Rarely: droppable caches of large recomputable values, backstop cleanup of external resources; never for correctness.
- *"Can a WeakMap key be a string?"* No — `TypeError`; primitives are never unreachable.

## Key takeaways

- WeakMap/WeakSet hold object keys weakly: entries vanish with their keys; no iteration, no size; objects only.
- Use for metadata on foreign objects, cross-module private data, and identity-keyed memoisation.
- `WeakRef.deref()` may return `undefined`; `FinalizationRegistry` callbacks are late or never — never depend on them.
- Reason about reachability; GC timing is not observable and not testable deterministically.
- A `Map` keyed by objects in a long-running process is a leak unless entries are explicitly removed.
