---
title: The event loop — a first look
minutes: 14
seo-title: JavaScript Event Loop: setTimeout vs Promise Output Order
description: JavaScript runs one task at a time on one call stack. Why promise callbacks run before setTimeout(0), how microtasks drain, and how to predict log order.
question: What is the event loop in JavaScript?
answer: The event loop is how JavaScript runs asynchronous code on a single thread. The engine runs one task — the script, a timer callback, an I/O callback — to completion on its one call stack, then drains the whole microtask queue (promise callbacks and `queueMicrotask`), then takes the oldest task from the task queue. So synchronous code prints first, promise callbacks second and `setTimeout(fn, 0)` last.
q: Why does Promise.then run before setTimeout 0?
a: A `.then` callback is a microtask and a `setTimeout` callback is a task. After the current script finishes, the event loop drains every microtask before it takes the next task, so promise callbacks always run before a timer, even one with a 0 ms delay.
q: What is the difference between a microtask and a macrotask?
a: Tasks, often called macrotasks, come from timers, I/O and events, and the event loop runs one per turn. Microtasks come from promise reactions and `queueMicrotask`; they run after the current task and before the next, and the queue is drained completely, including microtasks queued by microtasks.
q: Does setTimeout with 0 delay run immediately?
a: No. `setTimeout(fn, 0)` schedules `fn` as a task for a later turn, so it runs only after the current script and every pending microtask have finished. The delay is a minimum: if the stack stays busy for 100 ms, a 10 ms timer fires after about 100 ms.
q: Is JavaScript single-threaded?
a: Yes. Your code runs on one thread with one call stack, so two callbacks never interleave and no locks are needed. Concurrency comes from host APIs doing the waiting and the event loop running their callbacks between tasks; Worker threads give real parallelism.
q: What happens if you block the event loop?
a: Everything waits. While a long synchronous loop keeps the call stack busy, no timer callback, I/O callback or UI event can run, so a page freezes and a server stops responding. CPU-heavy work belongs in a Worker thread or in chunks spread across turns.
---
JavaScript runs your code on one thread, and yet a Node server handles thousands of connections and a browser stays responsive while a download runs. The trick is the **event loop**: the engine runs one piece of code to completion, then picks up the next piece from a queue — a timer that fired, a file that finished reading, a click. Nothing runs *at the same time* as your code; things run *after* it. This lesson is the first look — enough to predict the order of `console.log`s in code with `setTimeout` and promises, which is one of the most common interview questions in the language. Module 8 goes deep.

## The call stack

Every function call pushes a frame; returning pops it. When the stack is empty, the current *task* is finished. There is exactly one stack, and while it is non-empty nothing else — no timer callback, no click handler — can run. This is why `while (true) {}` freezes a page and why a long synchronous loop delays every timer: the loop must finish before the event loop gets a turn.

```js
console.log("a");
setTimeout(() => console.log("c"), 0);
console.log("b");
// a, b, c — the timer callback cannot run until the current script finishes, even with a 0 ms delay
```

## Tasks and the queue

Host APIs — timers, I/O, events — do their waiting *outside* the engine and, when done, put a **task** (a callback) on the task queue. The event loop's job: when the stack is empty, take the oldest task, run it to completion, repeat. `setTimeout(fn, 0)` therefore means "run `fn` in a later turn, not now", and a delay is a *minimum*: if the current task takes 200 ms, a 10 ms timer fires after 200 ms.

## Microtasks: the queue that jumps the line

Promises (and `queueMicrotask`) schedule **microtasks**, which run **after the current task finishes and before the next task starts** — the whole microtask queue is drained, including microtasks queued by microtasks. That gives the famous ordering:

```js
console.log("1");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
queueMicrotask(() => console.log("microtask"));
console.log("2");
// 1, 2, promise, microtask, timeout
```

Synchronous code first (`1`, `2`), then every microtask in order (`promise`, `microtask`), then the task (`timeout`). Node adds `process.nextTick(fn)`, which runs even before promise microtasks, and `setImmediate(fn)`, a task that runs after I/O callbacks in the current loop iteration — details for module 8; the sync → microtasks → tasks order is what to internalise now.

## Why this design

One thread means no data races: two callbacks never interleave in the middle of a statement, so JavaScript needs no locks and shared state is safe *within* a task. The cost is that any blocking work blocks everything — CPU-heavy loops belong in a Worker thread or in chunks yielded between turns, and I/O must be asynchronous, which is why every Node API that touches the outside world takes a callback or returns a promise. "Don't block the event loop" is the first rule of Node.

## Predicting output: the method

1. Run the whole script top to bottom, printing synchronous logs, and *collecting* what was scheduled: microtasks in one list, tasks (timers) in another.
2. Drain the microtask list in order — adding any microtasks they schedule to the end of the same list.
3. Take the first task; run it as a new step 1 (its own logs, its own microtasks drained before the next task).
4. Repeat until nothing is scheduled.

```js
setTimeout(() => { console.log("t1"); Promise.resolve().then(() => console.log("p-in-t1")); }, 0);
setTimeout(() => console.log("t2"), 0);
Promise.resolve().then(() => console.log("p1")).then(() => console.log("p2"));
console.log("sync");
// sync, p1, p2, t1, p-in-t1, t2
```

`p2` runs before `t1` because it is a microtask queued by a microtask; `p-in-t1` runs before `t2` because each task's microtasks drain before the next task starts.

## Timers, precisely

`setTimeout(fn, ms, ...args)` schedules once; `setInterval(fn, ms)` repeats; both return an id for `clearTimeout`/`clearInterval`. Delays are clamped (Node treats anything under 1 ms as 1 ms), never exact, and never early. Two timers with the same delay fire in creation order. A `setTimeout` inside a `setInterval` handler is the standard way to build a *self-adjusting* interval; a plain `setInterval` drifts.

## Blocking, measured

```js
const start = Date.now();
setTimeout(() => console.log("fired after", Date.now() - start, "ms"), 10);
while (Date.now() - start < 100) {}   // busy-wait 100 ms
// fired after ~100 ms — not 10
```

The timer was *due* at 10 ms; the loop kept the stack busy; the callback ran at the first opportunity. Every janky UI and every "my server stopped responding" has this shape.

## What comes next

Callbacks were how JavaScript expressed "later" for fifteen years and led to nesting hell; promises (ES2015) made "later" a value you can pass around; `async`/`await` (2017) made it read like synchronous code while still running on this same loop. Module 8 covers all three. For now, the mental model: **one stack, a task queue, a microtask queue that drains first.**

## Interview angle

- *"Is JavaScript single-threaded?"* Yes — one call stack; concurrency comes from the event loop scheduling callbacks between tasks (plus Worker threads for real parallelism).
- *"Order of `console.log` with `setTimeout(0)` and `Promise.then`?"* Synchronous logs, then promise callbacks (microtasks), then the timeout (task).
- *"What is a microtask?"* A callback (promise reaction, `queueMicrotask`) run after the current task and before any other task, with the queue drained completely.
- *"Does `setTimeout(fn, 0)` run immediately?"* No — after the current task and all microtasks; the delay is a minimum.
- *"Why must you not block the event loop?"* Everything — timers, I/O callbacks, UI events — waits behind the running task.

## Key takeaways

- One thread, one call stack; a task runs to completion before anything else runs.
- Host APIs queue tasks; the loop runs the oldest when the stack is empty; timer delays are minimums.
- Microtasks (promises, `queueMicrotask`) drain fully between tasks — hence sync → microtasks → tasks.
- Predict output by collecting, then draining, then taking one task at a time.
- Blocking delays everything; heavy work goes to Workers or asynchronous APIs.
