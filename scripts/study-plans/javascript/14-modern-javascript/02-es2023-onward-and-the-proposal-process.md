---
title: ES2023 onward, and how features get into the language
minutes: 12
---
Node 16 — this plan's runtime — stops at ES2022, so everything in this lesson is **reading**: the features you will meet in newer runtimes and codebases, what each replaces, and the process that produces them, so you can judge a proposal's maturity before adopting it. The exercises write polyfills for several of these on Node 16, which is the best way to understand exactly what they do — and the realistic situation of supporting a runtime older than the feature.

## ES2023

- **`findLast` / `findLastIndex`** — search from the end without `reverse()` copies.
- **Change-array-by-copy**: `toSorted(cmp)`, `toReversed()`, `toSpliced(start, del, ...items)`, `with(index, value)` — non-mutating twins of `sort`/`reverse`/`splice`/index assignment. They end the `[...arr].sort()` idiom and make immutable updates (module 11) one call. `with(-1, x)` accepts negative indices.
- **Hashbang** (`#!/usr/bin/env node`) formally allowed at the top of scripts and modules.
- **Symbols as WeakMap keys** (non-registered symbols).

## ES2024

- **`Object.groupBy(items, keyFn)`** → a null-prototype object of arrays; **`Map.groupBy`** → a Map (any key type). The group-by idiom (modules 4, 6, 11) becomes one call.
- **`Promise.withResolvers()`** → `{ promise, resolve, reject }` — the "deferred" pattern without the executor dance, for bridging events and queues (module 8's async queue).
- **`Array.fromAsync(asyncIterable)`** — collect an async iterable into an array (`for await` + push in one call).
- **Regex `v` flag** — set notation and string properties in character classes (`[\p{L}--[a-z]]`), a superset of `u` with stricter escaping.
- **ArrayBuffer transfer/resizable buffers**, **`Atomics.waitAsync`** — for workers and WASM.
- **Well-formed Unicode strings**: `isWellFormed()`/`toWellFormed()` — detect and repair lone surrogates (module 10).

## ES2025

- **Set methods**: `union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf`, `isDisjointFrom` — module 6's hand-written algebra becomes built-in.
- **Iterator helpers**: `iter.map(f).filter(p).take(n).toArray()` on any iterator, plus `Iterator.from` — module 6's lazy pipeline as methods.
- **`RegExp.escape`** — the `escapeRegExp` one-liner, standardised.
- **JSON modules** (`import data from "./x.json" with { type: "json" }`) and **import attributes**.
- **`Promise.try`** — run a sync-or-async function inside a promise chain.
- **Duplicate named groups** in regex alternatives.

## Near the finish line (stage 3 at the time of writing)

- **Explicit resource management**: `using res = open()` / `await using` — deterministic disposal via `Symbol.dispose`, like C#'s `using`/Python's `with`; TypeScript 5.2 ships it.
- **Temporal** — the replacement for `Date`: immutable, timezone-aware `PlainDate`, `ZonedDateTime`, `Duration`, correct arithmetic; polyfills exist and it is the most anticipated addition in a decade.
- **Decorators** — `@log` on classes and members, standardised after years of divergent TypeScript/Babel versions; TypeScript 5 implements the standard.
- **`Array.prototype.group`** was renamed to `Object.groupBy` (web compatibility); **Records & Tuples** were withdrawn (2025) in favour of exploring composites; the **pipeline operator** (`|>`) and **pattern matching** remain stage 1–2 — do not plan on them.

## How a feature becomes standard: TC39 stages

Ecma's TC39 committee advances proposals through stages: **0** (strawperson), **1** (problem accepted for exploration), **2** (draft spec text — the shape may still change), **2.7** (spec complete, awaiting tests — added 2023), **3** (candidate — implementations begin; the design is stable), **4** (finished — two shipping implementations and tests; goes into the next yearly edition). Practical rules: use stage 4 freely (transpile if your runtime lacks it); use stage 3 with a transpiler/polyfill only if the cost of a late change is acceptable; treat stage 2 and below as reading material. Babel's `preset-env` and TypeScript follow the same line — stage 3 or later.

## Knowing your runtime

Feature availability is a table of engines and versions: Node's release schedule (even majors are LTS; Node 16 reached end-of-life in 2023, 18 in 2025), browser evergreen releases, and Safari's slower cadence. Tools read **browserslist** (`"browserslist": ["defaults", "not IE 11"]`) to decide what to transpile and polyfill; `caniuse.com`, `node.green` and MDN's compatibility tables are the references. In practice: pick a `target` matching the *oldest* runtime you support, let the transpiler handle syntax, and load polyfills (`core-js`) only for built-ins that runtime lacks — feature-detected, not version-sniffed.

## Writing a polyfill correctly

```js
if (!Array.prototype.toSorted) {
  Object.defineProperty(Array.prototype, "toSorted", {
    value(compareFn) { return [...this].sort(compareFn); },   // spec: copy, then sort; same argument validation as sort
    writable: true, configurable: true, enumerable: false,    // enumerable: false — or for…in over arrays breaks
  });
}
```

Guard (`if (!…)`), define non-enumerable, match the spec's edge cases (negative indices in `with`, `RangeError` for out-of-range, `toSpliced` argument defaults), and prefer `core-js` for anything you did not read the spec for. Never polyfill something differently from the standard — pages that did that for `Array.prototype.flatten` are why the method is called `flat`.

## Common mistakes

- Using `toSorted`/`groupBy`/`structuredClone` on Node 16 or older Safari without a polyfill (a `TypeError: x is not a function` in production).
- Adopting stage 1–2 proposals (`|>`, pattern matching) via Babel plugins in application code.
- Version-sniffing instead of feature detection; enumerable prototype polyfills.
- Mixing up `Object.groupBy` (null-prototype object) and `Map.groupBy` (Map) return types.
- Expecting `with()` to mutate, or `toSpliced` to return the removed items (it returns the new array).

## Interview angle

- *"Name the change-array-by-copy methods."* `toSorted`, `toReversed`, `toSpliced`, `with` — non-mutating versions of the four mutators.
- *"What does `Object.groupBy` return?"* A null-prototype object of arrays keyed by the callback's result; `Map.groupBy` returns a Map.
- *"What are the TC39 stages?"* 0 strawperson → 1 proposal → 2 draft → 2.7 spec complete → 3 candidate (stable, implementations) → 4 finished (in the next edition).
- *"When is it safe to use a proposal?"* Stage 4 freely; stage 3 with transpiler support and eyes open; below that, no.
- *"How do you support an older runtime?"* Transpile syntax to its `target` and feature-detect polyfills for missing built-ins (browserslist + core-js).

## Key takeaways

- 2023: `findLast`, `toSorted`/`toReversed`/`toSpliced`/`with`; 2024: `Object.groupBy`/`Map.groupBy`, `Promise.withResolvers`, `Array.fromAsync`, regex `v`, well-formed strings; 2025: Set methods, iterator helpers, `RegExp.escape`, JSON modules, `Promise.try`.
- Coming: `using` disposal, Temporal, decorators; withdrawn/distant: records & tuples, pipeline, pattern matching.
- TC39 stages 0–4; adopt at 4, cautiously at 3.
- Know the oldest runtime you support; transpile syntax, feature-detect and polyfill built-ins, follow the spec exactly.
- Node 16 lacks everything in this lesson — which is why the exercises implement several of these features by hand.
