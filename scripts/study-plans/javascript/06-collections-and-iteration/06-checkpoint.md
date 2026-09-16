---
title: Checkpoint — Collections and iteration
minutes: 24
---
This checkpoint covers `Map` and `Set` (operations, SameValueZero, insertion order, the idioms and hand-written set algebra), the weak collections and why they cannot be iterated, the iteration protocol (`Symbol.iterator`, `next()`, `done`/`value`, laziness, `return()`), generators (`yield`, `yield*`, `next(value)`, lazy pipelines), and symbols as keys and as the language's hooks.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- Map versus object; how Map compares keys; how to count, group and index with a Map.
- Why a WeakMap has no `size` and takes only object keys; the three patterns it exists for.
- The exact shape of an iterator; iterable versus iterator; what `break` triggers.
- What runs when a generator is called, what `yield*` does, why the first `next(v)` argument is dropped.
- `Symbol()` versus `Symbol.for()`; which enumeration paths skip symbol keys; three well-known symbols.

The programs are an LRU cache built on a Map's insertion order, a graph explorer with adjacency sets and a breadth-first generator, and a small iterator toolkit — `chunk`, `zip`, `enumerate`, `takeWhile` — driven by commands.
