---
title: Checkpoint — Functional patterns
minutes: 24
seo-title: Functional JavaScript Quiz: Currying, Reduce and Memoization
description: Test functional JavaScript with 12 questions and three programs on pure functions, immutability, pipe and currying, reduce, trampolines, memoization and Result.
q: Why does prev.x === next.x work as a change detector after an immutable update?
a: Because an immutable update copies only the objects on the changed path and shares every other one by reference. If `x` was not touched, `next.x` is the very same object as `prev.x`, so one `===` answers "did it change" without a deep comparison, the mechanism behind React re-rendering and memoised selectors.
q: Why must a memoized recursive function call itself through the memoized name?
a: Because only the wrapper checks the cache. If the inner function recurses into itself directly, every call below the top bypasses the memo and the exponential recomputation returns. Write the recursive calls against the memoized binding, as `const fib = memoize((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2)))` does.
q: How does a Result railway short-circuit?
a: Each step is joined with `flatMap`, and an `Err`'s `flatMap` and `map` ignore the function they are given and return the same `Err`. The first failure therefore rides past every remaining step untouched, and the error arrives at the end, where one `match` handles both outcomes.
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
