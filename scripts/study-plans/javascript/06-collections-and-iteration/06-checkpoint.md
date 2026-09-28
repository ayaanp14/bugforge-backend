---
title: Checkpoint — Collections and iteration
minutes: 24
seo-title: JavaScript Map, Set, Iterators and Generators Practice Quiz
description: Test JavaScript collections and iteration with 12 questions and three programs: Map and Set, WeakMap, the iteration protocol, generators and symbols.
q: What is the exact shape of a JavaScript iterator?
a: An iterator is an object with a `next()` method that returns `{ value, done }`: `done: false` with each value, then `done: true` once the sequence ends. It may also have an optional `return()` method, which `break` calls so the iterator can clean up.
q: Why is the argument to a generator's first `next()` ignored?
a: Calling a generator runs none of its body. The first `next()` starts it and runs to the first `yield`, so there is no paused `yield` to receive the argument, and it is dropped. Values sent with later `next(v)` calls become the results of the `yield` expressions.
q: Why does a WeakMap have no `size` and take only object keys?
a: Its entries disappear when their keys are garbage collected, and collection must not be observable, so there is no `size` and no iteration. Keys must be objects because a primitive can never become unreachable, so holding one weakly would mean nothing.
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
