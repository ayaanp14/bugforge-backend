---
title: Combinators, concurrency limits, timeouts and cancellation
minutes: 14
---
Once every asynchronous operation is a promise, coordinating many of them becomes algebra: wait for **all**, wait for **any**, wait for the **first**, wait for all **regardless** of outcome. The four `Promise` combinators cover the common shapes; three patterns you write yourself cover the rest — a **concurrency limit** so a thousand requests do not all start at once, a **timeout** so nothing waits forever, and **cancellation** through `AbortController` so abandoned work stops. This lesson covers each, plus async iteration (`for await`) for sequences that arrive over time.

## The four combinators

```js
const [user, team] = await Promise.all([fetchUser(id), fetchTeam(tid)]);
```

| Combinator | Fulfils when | Rejects when | Result |
| --- | --- | --- | --- |
| `Promise.all(list)` | every promise fulfils | the **first** rejection (others keep running, results dropped) | array of values, in input order |
| `Promise.allSettled(list)` | always, once all settle | never | array of `{ status: "fulfilled", value }` / `{ status: "rejected", reason }` |
| `Promise.race(list)` | the first to **settle** fulfils | the first to settle rejects | that value / reason |
| `Promise.any(list)` | the first to **fulfil** | all reject → `AggregateError` with `.errors` | that value |

All four accept any iterable of promises *or plain values* (values are wrapped). `all` is the workhorse: fan out, wait, get results in order. `allSettled` is for batches where one failure must not hide the others. `race` is the building block for timeouts. `any` is "first success wins" — redundant sources, fastest mirror. An empty `all`/`allSettled` fulfils with `[]` immediately; an empty `race` stays pending forever; an empty `any` rejects.

Two details: rejection in `all` does not *cancel* the others — they finish and their results vanish; and each combinator attaches handlers to every input, so an input that rejects after `all` already rejected is still "handled" (no unhandled-rejection crash).

## Bounded concurrency

`Promise.all(urls.map(fetch))` starts **every** request at once — fine for five, a self-inflicted denial of service for five thousand. A **pool** runs at most `n` at a time:

```js
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const i = next++;                       // claim an index — safe: no await between read and increment
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return results;
}
```

`limit` runners each pull the next index when they finish — a work queue with no explicit queue object. Results land by index, so order is preserved. Real code adds error policy (fail fast versus collect via the `allSettled` shape) and this is exactly what libraries like `p-limit`/`p-map` do.

## Timeouts

```js
function withTimeout(promise, ms, message = `timed out after ${ms} ms`) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
```

`race` against a timer. The `finally` clears the timer so a fast result does not leave a pending timeout keeping the process alive (and firing a rejection nobody handles — `race` handled it, but the timer itself still runs). Node 16 also has `require("timers/promises").setTimeout(ms, value, { signal })` — a promise-based sleep that accepts an abort signal.

## Cancellation: `AbortController`

Promises cannot be cancelled — a settled-once value has no "stop" — so cancellation is a **signal** passed into the operation, which checks it:

```js
const controller = new AbortController();
setTimeout(() => controller.abort(), 500);                    // give up after half a second
try {
  const res = await fetch(url, { signal: controller.signal });    // fetch rejects with an AbortError on abort
} catch (err) {
  if (err.name === "AbortError") console.log("cancelled"); else throw err;
}

// honouring a signal in your own code
async function poll(fn, { signal }) {
  while (!signal.aborted) {
    await fn();
    await timersPromises.setTimeout(1000, undefined, { signal });   // sleeps that end early on abort
  }
  signal.throwIfAborted?.();                                        // Node 17.3+; on 16 throw manually
}
```

`signal.aborted`, `signal.addEventListener("abort", …)`, and `signal.reason` (Node 17.2+) are the surface. `fetch`, `timers/promises`, `fs.promises.readFile`, streams and `events.once` all accept a `signal`. Abort **rejects** with an error named `AbortError` — treat it as "stop", not as failure. `AbortSignal.timeout(ms)` (Node 16.14+) builds the timeout case directly — on older runtimes combine a controller with a timer.

## Retry with delay

```js
async function retry(fn, { attempts = 3, delayMs = 100, isTransient = () => true } = {}) {
  for (let i = 1; ; i++) {
    try { return await fn(i); }
    catch (err) {
      if (i >= attempts || !isTransient(err)) throw err;
      await sleep(delayMs * 2 ** (i - 1));      // exponential backoff: 100, 200, 400 …
    }
  }
}
```

Module 7's rules — transient only, idempotent only, bounded — plus a delay that grows (and, in production, a little random *jitter* so a thousand clients do not retry in lockstep).

## Async iteration

```js
for await (const chunk of stream) { … }          // any object with [Symbol.asyncIterator]
async function* pages(url) {                     // an async generator: yield inside, await allowed
  while (url) { const page = await fetchJson(url); yield* page.items; url = page.next; }
}
for await (const item of pages(first)) { if (enough(item)) break; }   // break → return() → cleanup
```

`for await` awaits each `next()`; it also accepts a *sync* iterable of promises, awaiting each in order. Async generators are the natural producer for paginated APIs, line-by-line file reading (`readline`), and event streams (`events.on(emitter, "data")` returns one). Items are processed **sequentially** — one at a time, in order — which is often the point.

## Events to promises

`const [value] = await events.once(emitter, "ready")` (Node) resolves on the first emission and rejects on `"error"`. For a browser `EventTarget`, wrap `addEventListener(…, { once: true })` in `new Promise`. Streams: `stream/promises` `pipeline` and `finished`.

## Common mistakes

- `Promise.all` for a batch where partial results matter (use `allSettled`); expecting `all` to cancel the rest on failure.
- Unbounded `map(fetch)` over large lists.
- A timeout `race` that does not clear its timer; a timeout that does not abort the underlying operation (it keeps running).
- Treating `AbortError` as a failure to log loudly.
- Retrying without backoff, jitter or a bound.
- `for await` when concurrency was wanted (it is sequential by design).

## Interview angle

- *"`Promise.all` versus `allSettled`?"* `all` rejects on the first failure and drops the rest; `allSettled` always fulfils with every outcome.
- *"How do you limit concurrency?"* A pool of `n` runners pulling from a shared index/queue; results stored by index.
- *"How do you add a timeout to a promise?"* `race` against a timer, clear the timer in `finally`, and abort the operation with a signal if it supports one.
- *"How do you cancel a promise?"* You cannot; pass an `AbortSignal` the operation honours and reject with `AbortError`.
- *"`race` versus `any`?"* First to settle (including rejection) versus first to fulfil.

## Key takeaways

- `all` (values in order, fail fast), `allSettled` (every outcome), `race` (first settle), `any` (first fulfil, `AggregateError` if none).
- Bound concurrency with a runner pool; it preserves order by index.
- Timeout = `race` + timer + `clearTimeout` in `finally`; cancellation = `AbortController` → `AbortError`, honoured by `fetch`, timers and fs.
- Retry transient, idempotent operations with bounded exponential backoff and jitter.
- `for await` and async generators process sequences that arrive over time, one item at a time.
