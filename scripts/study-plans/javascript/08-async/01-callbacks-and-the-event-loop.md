---
title: Callbacks and the event loop — one thread, two queues
minutes: 14
---
JavaScript runs your code on **one thread**. It never waits: when something takes time — a timer, a file read, a network request — the runtime hands the work to the system, keeps executing, and later runs a function you left for it. The machinery that decides *when* is the **event loop**, and its two queues — one for tasks, one for microtasks — explain every ordering puzzle: why `setTimeout(fn, 0)` runs after a `Promise.then`, why a long loop freezes the UI, why an `await` in a loop is sequential. Module 1 previewed this; this lesson is the real model, plus the callback style that Node was built on and that every later abstraction (promises, `async`) is sugar over.

## The call stack and the loop

Synchronous code runs to completion on the **call stack**. When the stack is empty the event loop picks the next **task** (a timer that expired, a completed I/O operation, an incoming event) and runs its callback — again to completion. Nothing interrupts running code: a callback cannot start until the current one finishes. That is why a `while (Date.now() < deadline) {}` busy-wait blocks *everything*, including timers that already expired, and why the single-threaded model has no data races: only one piece of JavaScript is ever running.

```js
console.log("A");
setTimeout(() => console.log("C"), 0);   // schedule a task for "as soon as possible after 0 ms"
console.log("B");
// A B C — C waits for the stack to empty, whatever the delay
```

## Microtasks versus tasks

There are two queues, and the loop drains them differently:

- **Tasks (macrotasks)**: timers (`setTimeout`, `setInterval`), I/O callbacks, `setImmediate`. One task per loop iteration.
- **Microtasks**: promise reactions (`.then`, `await` continuations), `queueMicrotask`, and in Node, `process.nextTick` (its own, even higher-priority queue). **All** pending microtasks run after the current task, before the next task — including microtasks queued by other microtasks.

```js
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
process.nextTick(() => console.log("tick"));
console.log("sync");
// sync, tick, promise, timeout
```

The rule: **synchronous code → nextTick queue → promise microtasks → the next task**. A microtask that keeps queueing microtasks starves the loop forever (no timer or I/O ever runs); a task that keeps scheduling tasks lets other tasks interleave. That is why microtasks are for "right after this, before anything else" and tasks are for "later, let other things happen".

## Node's loop phases, briefly

Node's loop runs in phases: **timers** (expired `setTimeout`/`setInterval`), **pending callbacks**, **poll** (I/O — where the process idles when there is nothing to do), **check** (`setImmediate`), **close callbacks**. Between every callback the microtask queues drain. Consequences worth knowing: `setImmediate` runs after I/O in the same iteration and before the next timers phase — inside an I/O callback it always beats `setTimeout(fn, 0)`; from the main module their order is unspecified (depends on how long startup took). `process.nextTick` runs before *any* of them and before promise microtasks; the Node docs recommend `setImmediate` for "yield to the loop" and `queueMicrotask`/`nextTick` only for "before anything else".

## Timers are minimums

`setTimeout(fn, 100)` means "not before 100 ms" — the callback runs at the first timers phase after the delay, once the stack is free. Under load it is late; two timers with the same delay run in registration order; delays below 1 ms are clamped to 1. Never rely on timers for exact timing or for ordering against I/O; rely on them for "at least this long". (Lesson 5 goes further.)

## The callback style

Before promises, asynchronous APIs took a function to call when done. Node fixed a convention — **error-first callbacks**: `(err, result) => …`, `err` is `null` on success:

```js
const fs = require("fs");
fs.readFile("config.json", "utf8", (err, text) => {
  if (err) return console.error("read failed:", err.message);   // handle, then RETURN — do not fall through
  const cfg = JSON.parse(text);
  fs.readFile(cfg.next, "utf8", (err2, more) => {               // the next step nests
    if (err2) return console.error(err2.message);
    …
  });
});
```

Rules: check `err` first and return; call the callback **exactly once**; call it asynchronously even when you have the answer already (a callback that sometimes runs synchronously — "releasing Zalgo" — makes callers' code run in two different orders); errors thrown *inside* a callback cannot be caught by the code that scheduled it (the scheduling stack is gone), so they must be passed to the callback, not thrown.

## Why callbacks were abandoned

Sequential steps nest ("callback hell"), error handling repeats at every level, running things in parallel and waiting for all of them needs hand-written counters, and a thrown error inside a callback crashes the process because no `try` is on the stack. Promises solve the composition problem (next lesson) and `async`/`await` solves the syntax problem (lesson 3). Callbacks remain in event emitters (`on("data", …)`), older APIs and the innermost layer of libraries — `util.promisify` converts an error-first function into a promise-returning one in one line, which is how you meet them today.

## Blocking, and why it matters

Because there is one thread, every millisecond of synchronous work delays every pending callback: a 200 ms JSON parse of a large payload freezes the browser's rendering or delays every other request in a Node server. Keep synchronous chunks short; move CPU-heavy work to a worker (`worker_threads`, Web Workers) or split it across tasks (`setImmediate` between chunks) so the loop can breathe. "Asynchronous" does not mean "parallel" — it means "not blocking the thread while waiting".

## Common mistakes

- Expecting `setTimeout(fn, 0)` to run before a pending `.then`.
- Busy-waiting or long synchronous loops that starve timers and I/O.
- Recursive `process.nextTick`/microtask scheduling that never yields.
- Callbacks called twice, called synchronously sometimes, or not called on an error path.
- Throwing inside a callback and expecting the caller's `try`/`catch` to see it.
- Forgetting `return` after handling `err`.

## Interview angle

- *"Explain the event loop."* One thread; the loop runs a task to completion, drains all microtasks, then takes the next task; timers and I/O are tasks, promise reactions are microtasks.
- *"Order of `setTimeout(0)`, `Promise.then`, `process.nextTick`, sync?"* sync → nextTick → then → timeout.
- *"Microtask versus macrotask?"* Microtasks run immediately after the current task, all of them; tasks run one per iteration and let others interleave.
- *"Error-first callback convention?"* `(err, result)`, check and return on `err`, call exactly once, asynchronously.
- *"Why does a long loop freeze the page?"* The single thread cannot run rendering or event callbacks until the loop's current task completes.

## Key takeaways

- One thread; a task runs to completion; then every microtask; then the next task.
- Microtasks: promise reactions, `queueMicrotask`, (Node) `process.nextTick` first; tasks: timers, I/O, `setImmediate`.
- Timers are minimum delays; same-delay timers keep registration order; `setImmediate` beats `setTimeout(0)` after I/O.
- Error-first callbacks: check `err` and return, call once, call asynchronously; errors inside callbacks cannot be caught by the scheduler.
- Blocking the thread delays everything; split or offload CPU-heavy work.
