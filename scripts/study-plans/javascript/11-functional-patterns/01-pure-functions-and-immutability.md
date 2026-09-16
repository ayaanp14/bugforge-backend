---
title: Pure functions and immutability — why, and how far to take it
minutes: 12
---
Functional programming in JavaScript is not about avoiding classes or writing everything as arrows; it is two disciplines that make code easier to reason about: functions that **only** compute their result from their inputs (**pure**), and data that is **not modified** after creation (**immutable**). Together they give you code you can test with a table of inputs and outputs, cache freely, run in any order, and debug by looking at values instead of histories. This lesson defines both precisely, shows what they buy, gives the update idioms and their costs, and — importantly — says where the boundary is: programs must have effects, and the skill is keeping them at the edges.

## Purity

A function is pure when it (1) returns the same result for the same arguments, every time, and (2) has no observable effect other than returning: no mutation of arguments or outer state, no I/O, no reading of anything that can change (the clock, `Math.random`, a global, a file). `(a, b) => a + b` is pure. `arr.push(x)`, `Date.now()`, `console.log`, `fetch`, and `let counter; () => counter++` are not.

What purity buys:

- **Testability** — a pure function is a table: inputs in, outputs out, no mocks, no setup.
- **Referential transparency** — a call can be replaced by its result, so you can cache it (memoisation), skip it when the inputs did not change (React's rendering model), or reorder and parallelise it.
- **Local reasoning** — to understand the function you read the function; nothing elsewhere changes its behaviour.

Impurity is not a sin; it is where the program touches the world. The design goal is a **pure core, impure shell**: parsing, validation, computation and decisions as pure functions; reading, writing, time and randomness pushed to a thin outer layer that calls them. A function that needs "now" takes `now` as a parameter; one that needs a random number takes an RNG; one that would log returns what should be logged. Then the core is testable and the shell is trivial.

## Immutability

Immutable data is never changed after creation; an "update" produces a **new** value sharing what did not change. JavaScript's primitives are already immutable; objects and arrays are not, so immutability is a discipline, enforced by convention, by `Object.freeze` in development, or by types (`readonly` in TypeScript).

```js
const user = { name: "Ada", tags: ["a"], address: { city: "London" } };
const moved = { ...user, address: { ...user.address, city: "Paris" } };   // new user, new address; tags shared
const tagged = { ...user, tags: [...user.tags, "b"] };                       // new tags array; address shared
const without = (({ tags, ...rest }) => rest)(user);                        // drop a key
const nextList = list.map((x) => (x.id === id ? { ...x, done: true } : x));  // update one element
const removed = list.filter((x) => x.id !== id);
const inserted = [...list.slice(0, i), item, ...list.slice(i)];
const sorted = [...list].sort(cmp);                                           // copy before mutating methods
```

**Structural sharing**: only the objects on the changed path are new; everything else is the same reference. That makes immutable updates cheap (O(depth), not O(size)) and makes **change detection** trivial — `prev.address === next.address` answers "did the address change" without a deep compare. It is the mechanism behind React/Redux re-rendering, memoised selectors, and undo/redo (keep the old root; it still exists).

## Mutating versus non-mutating methods

Mutate the receiver: `push pop shift unshift splice sort reverse fill copyWithin`, and assignment/`delete` on properties. Return new values: `map filter reduce slice concat flat flatMap` + spread, `Object.assign({}, …)`, `Object.entries/fromEntries`. Node 20 added `toSorted/toReversed/toSpliced/with` — on Node 16 copy first (`[...a].sort()`). Mutating methods are fine on data you **own** and have not shared (a local accumulator inside a function); the hazard is mutating something a caller or another module also holds.

## Freezing

`Object.freeze` is shallow (module 4). A `deepFreeze` recurses; in strict mode a write to a frozen property throws, which turns "someone mutated my config" from a mystery into a stack trace. Freeze constants, defaults, and fixtures in development; in production, freezing large structures costs time and is usually dropped (types or discipline do the job). Freezing does not make a *value* immutable — `const` prevents rebinding only.

## Costs and limits

Copying has a cost proportional to the changed path's width (an object with 50 keys is copied on every update to one key). For most application state it is negligible; for hot loops over large arrays, a local mutable accumulator that is built and then never mutated again is both faster and still "immutable from the outside". Libraries handle the awkward middle: **Immer** lets you write mutating code against a draft and produces the immutable result with structural sharing; **Immutable.js**/persistent structures give O(log n) updates for very large collections.

Known trap: a shallow copy shares nested objects, so a later "harmless" mutation of `moved.tags.push(...)` changes `user.tags` too. Either never mutate nested values or copy the path you change.

## Where effects belong

Sequence a program as: gather inputs (impure) → compute (pure) → apply outputs (impure). A request handler reads the body and the database (effects), calls `decide(order, inventory)` (pure), then writes and responds (effects). The pure function is where the logic and the tests live; the shell should be so thin it needs only an integration test.

## Common mistakes

- Calling a function pure while it reads a module-level variable that changes, or `Date.now()`.
- Mutating an argument (`opts.retries = 3`) — callers' objects change under them.
- Spread-copying one level and mutating deeper.
- `sort`/`reverse` on shared arrays; `push` into an array received as a parameter.
- Freezing everything in production, or believing `const` makes objects immutable.
- Over-copying in hot loops where a local mutable accumulator was fine.

## Interview angle

- *"What is a pure function?"* Same inputs → same output, no side effects; testable as a table, cacheable, reorderable.
- *"Why immutability?"* Local reasoning, cheap change detection by reference, safe sharing, undo/redo, no action-at-a-distance bugs.
- *"How do you update nested state immutably?"* Spread each level on the changed path; untouched siblings stay shared (structural sharing).
- *"Isn't copying slow?"* O(changed path), not O(size); measure before optimising; Immer/persistent structures for extreme cases.
- *"How do you handle effects then?"* Pure core, impure shell — pass time/randomness in, return what should be written out.

## Key takeaways

- Pure = deterministic + effect-free; push effects (I/O, time, randomness) to the edges and pass them in as arguments.
- Immutable updates spread the changed path; structural sharing makes them cheap and makes `===` a change detector.
- Know the mutating methods; copy before them on shared data; mutate only what you own locally.
- `Object.freeze` (deep, in development) turns accidental mutation into an error; `const` is not immutability.
- Immer and persistent structures for the hard cases; a local mutable accumulator is fine when nothing else sees it.
