---
title: Memory and garbage collection — generations, reachability, and the leaks that survive it
minutes: 13
---
JavaScript frees memory for you, which is why memory problems in JavaScript are not "forgot to free" but "kept a reference": the collector reclaims only what is **unreachable**, and one surviving reference — a listener, a cache entry, a closure, a timer — keeps an entire object graph alive. Understanding how V8's collector works (a young generation for short-lived objects, an old generation for survivors), what reachability means precisely, and the handful of patterns that leak in practice turns "the process grows until it dies" from a mystery into a checklist. This lesson covers the heap and its generations, allocation cost, the leak catalogue, the diagnostic tools (heap snapshots, `process.memoryUsage`, comparisons), and the limits you should know.

## Reachability

An object is alive if it can be reached from a **root** — the global object, the current call stack (locals and arguments of every active frame), and internal engine references — by following properties, closure scopes, array elements, Map/Set entries and prototype links. Everything else is garbage and will be collected *eventually*; when is not specified and not observable (module 6). Two consequences: a reference *anywhere* on a reachable path keeps the target alive, however "forgotten"; and freeing is never manual — you release memory by dropping references (`x = null`, `map.delete`, `removeEventListener`, letting a scope end).

## The heap: young and old

V8 splits the heap by object age, betting on the **generational hypothesis** — most objects die young:

- **New space (young generation)**, a few MB, split into two semi-spaces. Allocation is a pointer bump — nearly free. It fills quickly; a **scavenge** (minor GC) copies the live objects to the other semi-space and abandons the dead ones in one sweep. Cheap because most are dead. Objects that survive two scavenges are **promoted** to old space.
- **Old space (old generation)**, large: survivors, big objects, and code. Collected by **mark–sweep–compact** (major GC): mark everything reachable from the roots, sweep the rest, occasionally compact to defragment. Expensive and proportional to the live heap — but V8 runs it **incrementally and concurrently** (Orinoco) so pauses stay short, and only when old space grows.

The performance angle: a high **allocation rate** of short-lived objects costs scavenges (cheap, but not free — and each promotes a few objects that then cost major GCs); a growing set of **long-lived** objects costs major GCs proportional to the heap. Allocation-heavy hot loops (a temporary object per iteration, spread copies in `reduce`) show up in profiles as GC time; the fix is fewer allocations in the hot path — local mutable accumulators, reusing buffers, typed arrays — not object pooling everywhere (V8's allocator is faster than most pools).

## The leak catalogue

A leak is a reference you did not intend to keep. In order of frequency:

1. **Unbounded caches** — a module-level `Map`/object keyed by request data that only grows (module 6's `WeakMap` and module 11's LRU are the fixes).
2. **Event listeners** never removed — a component adds `window.addEventListener` and is destroyed without removing it; the listener's closure keeps the component and everything it references. Same for `EventEmitter.on` on long-lived emitters (Node warns at 11 listeners for a reason).
3. **Timers** — `setInterval` never cleared; a `setTimeout` chain that restarts itself. The callback keeps its closure alive.
4. **Closures over large data** — a small callback captures a variable from a scope that also holds a large buffer; the whole scope object stays.
5. **Detached DOM nodes** — removed from the document but still referenced from a JavaScript array or Map; each keeps its subtree.
6. **Global accumulation** — arrays that are pushed to and never trimmed (logs, history, "seen" lists); `globalThis` properties.
7. **Promises never settled** — pending promises hold their reaction closures; a queue of `new Promise` that never resolves grows forever.
8. **Bound methods and per-render closures** — a new bound function per render added as a listener each time.

Each one is "a reference you forgot", which is why the diagnostic is always the same: find what is holding the objects.

## Diagnosing

```js
process.memoryUsage();          // { rss, heapTotal, heapUsed, external, arrayBuffers } in bytes — sample it periodically
```

`heapUsed` climbing across requests (after GC — trigger it with `--expose-gc` and `global.gc()` in a test, never in production) is the signature. Then a **heap snapshot**: Chrome DevTools → Memory → Heap snapshot (browser or Node via `--inspect`), or `v8.writeHeapSnapshot()`/`--heapsnapshot-signal` in Node. Take two snapshots with the suspected activity between them and use **Comparison** view: objects whose count grew are the leak; the **Retainers** panel shows the path from a root to a leaked object — the reference you forgot. Sort by *retained size* (what would be freed) not *shallow size*. The **Allocation timeline** records who allocated what between two points. `--trace-gc` logs every collection with heap sizes — a quick way to see promotion pressure and whether the old generation is growing.

## Limits and tuning

Node's old space is capped (roughly 2–4 GB depending on version and platform; `--max-old-space-size=4096` raises it). Hitting it produces `FATAL ERROR: Reached heap limit — JavaScript heap out of memory`, usually from a leak or from loading something huge into memory (a whole file, a whole result set) instead of streaming (module 9). Raising the limit buys time; it does not fix a leak. Buffers and typed arrays live outside the JavaScript heap (`external`/`arrayBuffers`) and have their own accounting. Browser tabs have their own limits and kill the page.

## Weak references, again

`WeakMap`/`WeakSet` for metadata keyed by objects, `WeakRef` for droppable caches, `FinalizationRegistry` as a backstop — module 6 covered when. They are the tools for "I want to associate data with this object without keeping it alive", and the wrong tool for "I want to know when memory is freed" (unobservable by design).

## Habits

- Every `addEventListener`/`on`/`setInterval`/subscription has a matching removal in the component's teardown, or uses an `AbortSignal`.
- Caches are bounded (LRU/TTL) or weak.
- Long-lived collections are trimmed; "history" has a maximum length.
- Large data is streamed, not accumulated; results are paginated.
- Hot loops avoid per-iteration allocations; benchmarks include GC time (many samples).
- Memory is measured in staging under load before and after a change, like latency.

## Common mistakes

- Treating growth as "the GC is lazy" — the collector cannot free what is reachable.
- Module-level `Map` caches keyed by ids in a server; listeners without teardown; `setInterval` without `clearInterval`.
- Loading files/query results whole; raising `--max-old-space-size` instead of fixing the leak.
- Object pooling by reflex (slower than the allocator for small objects).
- Reading shallow size instead of retained size in a snapshot; taking one snapshot instead of comparing two.

## Interview angle

- *"How does JavaScript garbage collection work?"* Reachability from roots; V8 uses a generational collector — cheap scavenges of the young generation, incremental mark-sweep-compact of the old — and frees only unreachable objects.
- *"What causes memory leaks in JavaScript?"* Kept references: unbounded caches, listeners and timers never removed, closures over large scopes, detached DOM nodes, ever-growing arrays.
- *"How do you find a leak?"* Watch `heapUsed` grow across GCs, take two heap snapshots around the activity, compare, and follow the retainer path from a root.
- *"Why is a high allocation rate a cost if young-gen GC is cheap?"* Scavenges are frequent and each promotes a few objects that later cost major GCs; fewer allocations in hot paths means less GC time.
- *"When would you use a `WeakMap` to prevent a leak?"* Data keyed by objects you do not own, so entries vanish with the objects.

## Key takeaways

- Reachable = alive; leaks are references you kept — the collector is never the culprit.
- Young generation: cheap scavenges, survivors promoted; old generation: incremental mark-sweep-compact proportional to live heap.
- Leak catalogue: unbounded caches, listeners, timers, closures over big scopes, detached DOM, growing globals, pending promises.
- Diagnose with `process.memoryUsage`, two heap snapshots compared, retainer paths and retained size; `--trace-gc` for promotion pressure.
- Bound caches, remove listeners, stream large data, limit allocations in hot loops; `--max-old-space-size` buys time, not a fix.
