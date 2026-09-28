---
title: Checkpoint — Asynchronous JavaScript
minutes: 25
seo-title: Async JavaScript Quiz: Event Loop, Promises and Async/Await
description: Test asynchronous JavaScript with 12 questions and three programs: the event loop, promise chaining, async/await, Promise.all and race, timeouts, debounce.
q: In what order do sync code, `process.nextTick`, `Promise.then` and `setTimeout(0)` run?
a: Synchronous code first, then `process.nextTick` callbacks, then promise reactions such as `.then`, then the `setTimeout(0)` callback. Every pending microtask runs before the event loop takes its next task, and a timer callback is a task.
q: Why is `await` inside a loop sequential?
a: Each `await` pauses the function until that one promise settles, so the next iteration's operation does not start until the previous one has finished. To run independent operations concurrently, map the items to promises first and `await Promise.all` over them.
q: What is the difference between `Promise.race` and `Promise.any`?
a: `Promise.race` settles as soon as the first input settles, so an early rejection wins. `Promise.any` waits for the first input to fulfil, ignoring rejections, and rejects with an `AggregateError` only if every input rejects.
---
This checkpoint covers the event loop (one thread, tasks versus microtasks, `nextTick`, Node's phases), error-first callbacks, promise states and the chaining rules, `async`/`await` semantics (sequential versus concurrent, `return await`, floating promises, races across `await`), the four combinators, bounded concurrency, timeouts and `AbortController`, async iteration, and timers with debounce/throttle.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- The order of sync code, `process.nextTick`, `Promise.then`, `setTimeout(0)`; why a recursive microtask starves the loop.
- What `then` returns and what happens when a handler returns a value, a promise, or throws; what an unhandled rejection does in Node.
- Why `await` in a loop is sequential; how to run independent work concurrently; why `forEach(async)` is wrong; when `return await` matters.
- `all` versus `allSettled` versus `race` versus `any`; how a concurrency pool works; how a timeout and a cancellation are built.
- Debounce versus throttle; `setInterval` versus recursive `setTimeout`; what keeps a Node process alive.

The programs are a dependency-aware job scheduler that starts each job when its prerequisites finish, a fetch pipeline with retry, backoff, timeout and per-item outcomes, and an async queue with waiting consumers.
