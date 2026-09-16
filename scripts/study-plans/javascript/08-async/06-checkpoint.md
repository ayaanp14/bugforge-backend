---
title: Checkpoint — Asynchronous JavaScript
minutes: 25
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
