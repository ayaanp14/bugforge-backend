---
title: Checkpoint — Functional patterns
minutes: 24
---
This checkpoint covers pure functions and the pure-core/impure-shell design, immutable updates with structural sharing, `pipe`/`compose`, currying, partial application and data-last design, `reduce` as the universal fold and its O(n²) trap, recursion limits and trampolines, memoization (keys, bounding, memoized recursion), `once`, thunks and lazy sequences, and `Maybe`/`Result` railways.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- The two conditions for purity; where effects belong; why `prev.x === next.x` works as a change detector after an immutable update.
- `pipe` versus `compose` order; why auto-curry breaks on default parameters; what data-last buys.
- `map`/`filter`/`groupBy` as `reduce`; why spreading the accumulator is O(n²); why V8 has no tail calls and what a trampoline does.
- What makes a good memoization key; when a cache must be bounded; why the recursive call must go through the memoized name.
- `map` versus `flatMap` on `Maybe`/`Result`; how the railway short-circuits; when `?.` beats `Maybe`.

The programs are a tiny immutable store with a reducer, history and a memoized selector; a pipeline DSL that parses a text description into composed data-last functions; and a Result-based configuration loader that mirrors module 7's exception-based one.
