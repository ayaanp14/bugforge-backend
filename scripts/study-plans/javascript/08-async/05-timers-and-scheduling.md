---
title: Timers and scheduling — setTimeout, setInterval, nextTick, and debounce/throttle
minutes: 12
---
Timers are the simplest asynchronous API and the most misunderstood: `setTimeout(fn, 100)` promises "not before 100 ms", not "at 100 ms"; `setInterval` drifts and overlaps; a forgotten timer keeps a Node process alive; and the three "run this soon" calls — `process.nextTick`, `queueMicrotask`, `setImmediate` — mean three different things. This lesson covers each primitive precisely, the promise-based timers in `timers/promises`, the two rate-control patterns every UI and every API client needs (debounce, throttle), and measuring time correctly.

## `setTimeout` and `clearTimeout`

```js
const id = setTimeout(() => console.log("later"), 100);   // returns a handle (an object in Node, a number in browsers)
clearTimeout(id);                                           // cancels if it has not fired; harmless otherwise
setTimeout(greet, 100, "Ada");                              // extra arguments are passed to the callback
```

The delay is a **minimum**: the callback runs at the first timers phase after the delay elapses *and* the stack is free. A delay of `0` (or omitted) means "next timers phase"; browsers clamp nested timeouts to ≥ 4 ms and background tabs to ≥ 1 s; Node clamps below 1 to 1 and above 2³¹−1 to 1 (with a warning — a 25-day timer overflows). Same-delay timers fire in creation order. The callback's `this` is `undefined`/the global — use an arrow.

## `setInterval`, and why a recursive timeout is often better

```js
const id = setInterval(tick, 1000);
clearInterval(id);
```

`setInterval` schedules every `n` ms regardless of how long `tick` took — if `tick` is slow or the loop is busy, callbacks bunch up and drift accumulates; an async `tick` can overlap with itself. A **recursive `setTimeout`** — `function loop() { tick(); setTimeout(loop, 1000); }` or, with `await`, `while (running) { await tick(); await sleep(1000); }` — waits for the work to finish before scheduling the next run and never overlaps. Use `setInterval` for cheap, fixed-cadence work (a clock display); use the recursive form for anything that does I/O.

## Keeping the process alive — `ref`/`unref`

In Node an active timer (or interval) keeps the event loop running: a script with a pending `setTimeout` does not exit until it fires. `timer.unref()` says "do not keep the process alive for me" — right for a periodic cache sweep or a heartbeat that should stop when the real work ends. `timer.ref()` reverses it. Forgetting to clear an interval is the usual reason a CLI "hangs" after printing its result.

## The "soon" family

| Call | When it runs | Use |
| --- | --- | --- |
| `process.nextTick(fn)` | before any other queued microtask, right after the current operation | Node-specific; emit an event *after* the constructor returns; rarely in application code |
| `queueMicrotask(fn)` | after nextTicks, with promise reactions, before any task | standard; "after this sync code, before anything else" |
| `Promise.resolve().then(fn)` | same queue as `queueMicrotask` | idiomatic in promise code |
| `setImmediate(fn)` | the check phase — after I/O callbacks of this iteration, before the next timers | "yield to the event loop, then continue" (Node); breaking up CPU work |
| `setTimeout(fn, 0)` | the next timers phase | portable "yield"; slightly later than `setImmediate` after I/O |

Microtasks (`nextTick`, `queueMicrotask`) do **not** let I/O or timers run in between — a recursive microtask starves the loop. To yield for real, use `setImmediate` (Node) or `setTimeout(fn, 0)`; in browsers `requestAnimationFrame` runs before the next paint and `requestIdleCallback` when idle.

## Promise-based timers

```js
const { setTimeout: sleep, setInterval: every } = require("timers/promises");   // Node 15+
await sleep(100);                              // resolves after 100 ms
const v = await sleep(100, "value");           // resolves with "value"
await sleep(5000, undefined, { signal });      // rejects with AbortError when the signal aborts — a cancellable sleep
for await (const tick of every(1000, Date.now())) { if (done()) break; }   // an async iterator that yields every second
```

`timers/promises` makes waits composable with `await`, `Promise.race` (timeouts) and `AbortSignal`. Without it, the one-liner is `const sleep = (ms) => new Promise((r) => setTimeout(r, ms))`.

## Debounce and throttle

Both limit how often a frequently-fired function actually runs, differently:

```js
// debounce: run once, `wait` ms after the LAST call — search-as-you-type, resize, autosave
function debounce(fn, wait) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
}

// throttle: run at most once per `wait` ms, immediately on the first call — scroll handlers, progress updates
function throttle(fn, wait) {
  let last = -Infinity;
  return (...args) => { const now = Date.now(); if (now - last >= wait) { last = now; fn(...args); } };
}
```

Debounce waits for quiet: a burst of 20 keystrokes produces one call after the typing stops (the last arguments win). Throttle guarantees progress during the burst: one call per window (the first arguments in each window). Variants add a *leading*/*trailing* option, a `cancel()` method (clear the timer on unmount — a debounced call firing after a component is gone is a classic React bug) and a `flush()`. Lodash's `debounce`/`throttle` are the reference implementations.

## Measuring time

`Date.now()` is wall-clock milliseconds — fine for timestamps, wrong for durations (it jumps when the clock is adjusted). `performance.now()` (global in Node 16+ and browsers) is a monotonic high-resolution timer for measuring: `const t0 = performance.now(); …; const ms = performance.now() - t0`. `process.hrtime.bigint()` is the nanosecond version. `console.time(label)`/`console.timeEnd(label)` is the quick-and-dirty form.

## Common mistakes

- Relying on exact timer timing or on `setTimeout(0)` ordering against I/O.
- `setInterval` for work that does I/O — overlapping runs and drift.
- A pending timer or interval keeping a script alive (or `unref` on a timer that *should* keep it alive).
- Recursive `nextTick`/`queueMicrotask` starving the loop.
- Debounce without `cancel` on teardown; throttle where debounce was wanted (or vice versa).
- Measuring durations with `Date.now()`.

## Interview angle

- *"What does `setTimeout(fn, 0)` guarantee?"* Only that `fn` runs no sooner than the next timers phase, after the current code and all microtasks.
- *"Debounce versus throttle?"* Debounce fires once after calls stop; throttle fires at most once per interval during the calls.
- *"`setInterval` versus recursive `setTimeout`?"* Fixed cadence regardless of duration (drift, overlap) versus scheduling the next run after the work completes.
- *"`process.nextTick` versus `setImmediate`?"* nextTick runs before any I/O or timers (microtask-like, first); setImmediate runs in the check phase after I/O.
- *"How do you measure elapsed time?"* `performance.now()` — monotonic; `Date.now()` is wall-clock and can jump.

## Key takeaways

- Timers are minimums; same-delay order is creation order; `clearTimeout`/`clearInterval` cancel; Node timers keep the process alive unless `unref()`.
- Prefer recursive `setTimeout`/`await sleep` loops to `setInterval` for real work.
- `nextTick` → microtasks → `setImmediate`/timers; only the last two truly yield to I/O.
- `timers/promises` gives awaitable, abortable sleeps and intervals.
- Debounce (after the burst) versus throttle (during the burst), both with `cancel`; measure with `performance.now()`.
