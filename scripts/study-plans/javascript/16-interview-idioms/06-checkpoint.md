---
title: Checkpoint — Interview idioms
minutes: 26
---
This checkpoint closes the track. It covers the interview template and its JavaScript-specific decisions; the twelve algorithm patterns and their complexities; the idiom sheet and the trap behind each idiom; the reimplementation questions and the spec details they hinge on; and the theory repertoire in its two-sentence form.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module — and with it the JavaScript study plan.

**Before you start**, make sure you can answer:

- The six steps of the template and the choices to make before being asked (`Map`/`Set`, comparators, index-pointer queues, code points, `BigInt`, `Array.from` grids).
- The signs that identify each pattern, its template shape, and the complexity of the whole solution including any sort.
- The trap behind each idiom on the sheet: `sort()`, `Math.max(...big)`, `Array(n).map`, `reduce` without a seed, `s.length`, `parseInt` in `map`, JSON round trips, `Object.freeze`.
- The detail that decides each reimplementation: `bind` and `new`; `map` and holes; `reduce` and the empty array; `Promise.all` and order; `then` and microtasks/adoption; `JSON.stringify` and `undefined`/`NaN`/`toJSON`/cycles.
- The two-sentence answers to the theory repertoire and where each goes deeper.

The programs are the three reimplementations senior rounds ask for most: a `Promise` class with chaining, adoption, `catch`/`finally` and the four static combinators, driven by a script and printing the real settlement order; a `JSON.stringify` that matches the native one on every listed case, including `toJSON`, replacers, indentation and cycle detection; and a deep-equality and deep-clone toolkit that handles `NaN`, `Date`, `Map`, `Set`, cycles and shared references, reported as a TAP log.
