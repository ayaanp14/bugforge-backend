---
title: Writing fast JavaScript — the habits that survive measurement
minutes: 13
---
After profiling has pointed at a hot spot, what do you actually change? The techniques that reliably help are few and mostly boring: fix the algorithm, use the right data structure, avoid allocating in the loop, keep shapes and types uniform, batch work that crosses a boundary, and move CPU-heavy work off the main thread. The techniques that do not help — or hurt — are the folklore: `for` versus `forEach`, string concatenation tricks, object pools, avoiding closures. This lesson is the first list with reasons, the second list with why it is obsolete, and the meta-rule: every item here is a *response to a measurement*, never a default style.

## 1. Fix the complexity

The largest wins, always. Patterns to recognise in a profile:

| Slow shape | Fast shape |
| --- | --- |
| `arr.includes(x)` / `find` inside a loop over another array — O(n·m) | a `Set`/`Map` built once — O(n + m) |
| `Object.keys(obj).length` or `JSON.stringify` inside a loop | compute once outside |
| `arr.shift()` as a queue — O(n) per dequeue | an index pointer or a linked deque |
| `[...acc, x]` / `{ ...acc }` in `reduce` — O(n²) | push into a local accumulator |
| `str += piece` for megabytes | parts array + one `join`, or a stream |
| sort inside a comparator; `localeCompare` in a hot sort | precompute keys; `Intl.Collator` reused |
| repeated `querySelector` in a loop | query once, or delegate |
| N+1 database queries | one query with `IN`, or a join |

Estimate: how many times does the inner operation run for n items? If the answer grows faster than n, that is the fix.

## 2. Choose the data structure

`Set` for membership, `Map` for lookups by key (any type) and frequent add/delete, arrays for ordered sequences and iteration, typed arrays for large numeric data, `Object.create(null)`/`Map` for dictionaries keyed by data. An array of objects with 8 fields is far more memory- and cache-efficient than an object of arrays only when iterated whole; **struct-of-arrays** (`Float64Array` per field) wins for numeric batch computation (physics, charts, image data). Strings are immutable: repeated `slice`/`concat` on huge strings creates rope structures that are fine to build and slow to index.

## 3. Allocate less in hot paths

Every `{}`, `[]`, closure, spread, `map` result and template literal in a hot loop is an allocation the young-gen collector must process. Techniques: reuse a scratch array or object across iterations (reset it, do not reallocate); return primitives or reuse a result object when the caller consumes it immediately; prefer `for…of`/`for` over chains that create intermediate arrays **when profiling shows it**; use typed arrays as fixed buffers; avoid creating closures inside the loop body (hoist them). Do not pool small objects — V8 allocates faster than a pool checks in and out, and pools leak.

## 4. Keep shapes and types stable (lesson 1)

Uniform objects from one constructor or literal shape; no conditional property adds; no `delete`; homogeneous arrays without holes; numbers that stay integers or stay doubles; one type per variable in hot functions (a variable that is sometimes a string and sometimes a number makes every operator on it polymorphic). Small, single-purpose functions inline well; a giant function with a dozen roles does not.

## 5. Do less work

- **Lazy evaluation**: compute on first use (`once`, lazy getters — module 11); render what is visible (virtualised lists); load what is needed (code splitting, `IntersectionObserver`).
- **Memoize** pure, repeated, expensive computations with bounded caches (module 11).
- **Debounce/throttle** high-frequency input (module 8): one search per pause, one layout per frame.
- **Early exit**: `some`/`find`/`break` instead of processing everything and filtering at the end.
- **Cache derived values** when the source changes rarely; invalidate by reference (module 11's selectors).

## 6. Batch across boundaries

Crossing a boundary — DOM, network, disk, process, worker — costs far more than the work inside. Batch DOM writes (fragments, `requestAnimationFrame` — module 12), coalesce network requests (one request for ten ids, not ten requests), write files in chunks or through a stream, send one message with an array to a worker rather than a thousand messages. The event loop is a boundary too: a 200 ms synchronous chunk blocks everything; split long CPU work across tasks (`setImmediate`, `scheduler.yield()` in browsers) so input and I/O interleave — or move it out entirely.

## 7. Move CPU work off the thread

`worker_threads`/Web Workers for parsing, compression, image processing, crypto, large sorts; pass `ArrayBuffer`s by **transfer** (zero-copy) or use `SharedArrayBuffer` for shared numeric state; use a worker pool sized to cores. WebAssembly for existing native libraries or hot numeric kernels (module 14). Neither helps I/O-bound code — that is already asynchronous.

## 8. Stream instead of accumulate

Whole-file reads, whole-result-set queries and whole-response buffers cost memory proportional to the data and delay the first output until the last byte arrives. Streams (module 9) process in constant memory and start emitting immediately; paginate queries; use `for await` over line-oriented input.

## Folklore, retired

- `for` versus `forEach`/`map`: the engine inlines small callbacks; pick by readability, switch only if the profiler names the loop.
- String building with arrays "for speed": `+=` is fine up to large sizes (ropes); use `join` for clarity or streams for huge output.
- Avoiding closures/`try`/`arguments`/`const` for speed: no longer meaningful.
- Object pooling for small objects: slower and leak-prone.
- Caching `arr.length` in a `for` condition, bit tricks (`x >> 1`), `switch` over `if` chains: micro-noise the compiler already handles.
- `==` versus `===`: `===` is correct and not slower.

## The meta-rule

Readable code that runs in the interpreter for one millisecond a day needs nothing from this list. Apply a technique when a profile shows the hot spot and a benchmark shows the change helps; leave a comment saying what was measured (this codebase's comments carry measured latencies for exactly that reason); and remove the optimisation if a later measurement shows it stopped mattering. Fast code that nobody can read is a maintenance bill; unreadable fast code with no measurement behind it is the worst of both.

## Common mistakes

- Micro-optimising before checking Big-O.
- Rewriting readable chains into loops everywhere "for performance" without a profile.
- `arr.shift()` queues; `includes` in loops; spreading accumulators.
- Per-iteration allocations and closures in hot loops; polymorphic variables.
- Batching nothing: a DOM write or a request per item.
- CPU-heavy work on the main thread; whole-file/whole-result loading.

## Interview angle

- *"How would you speed up a slow function?"* Profile; fix complexity and data structures; reduce allocations and keep shapes stable in the hot path; batch boundary crossings; measure before and after.
- *"`for` loop or `map`?"* Whichever reads better — the engine inlines small callbacks; change only when a profile names the loop.
- *"When are typed arrays worth it?"* Large numeric data: fixed representation, no boxing or holes, transferable to workers.
- *"How do you keep the UI responsive during heavy computation?"* Split across frames/tasks or move to a Web Worker; batch DOM writes.
- *"Should you pool objects in JavaScript?"* Rarely — the allocator is fast and pools leak; reuse a scratch buffer only where a profile shows allocation cost.

## Key takeaways

- Complexity and data structures first: Sets/Maps for lookups, no O(n²) reduces, no `shift` queues, no N+1.
- Then allocation and shape stability in the measured hot path; typed arrays for numbers.
- Do less (lazy, memoized, debounced, early exit) and batch every boundary crossing; split or offload long CPU work; stream large data.
- Retire the folklore: loops versus methods, string tricks, closures, pools — pick readability.
- Every optimisation answers a measurement and carries a comment saying so.
