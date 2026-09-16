---
title: async/await — promises with the syntax of ordinary code
minutes: 14
---
`async`/`await` (2017) did not add a capability; it added **readability**. An `async` function returns a promise; `await` pauses the function until a promise settles and gives you its value — or throws its rejection — so asynchronous steps read top to bottom with `try`/`catch`, loops and early returns like any synchronous code. The cost of that readability is a handful of rules people learn by getting them wrong: `await` in a loop is sequential, a missing `await` is a silent bug, `return promise` inside `try` does not get caught, and every `await` yields to the event loop even when the value is already there. This lesson covers the semantics precisely, the sequential-versus-concurrent decision, error handling, and the patterns that make async code correct as well as readable.

## The two keywords

```js
async function loadDashboard(userId) {            // returns a Promise, always
  const user = await fetchUser(userId);            // pause here until fetchUser's promise settles
  const team = await fetchTeam(user.teamId);       // runs after — sequential
  return { user, team };                           // fulfils the returned promise with this object
}
loadDashboard(1).then(render).catch(showError);    // callers see a normal promise
```

- **`async`** marks a function whose return value is wrapped in a promise: `return x` fulfils with `x` (a returned promise is adopted), `throw` rejects. Works on declarations, expressions, arrows, methods (`async method() {}`), and generators (`async function*`).
- **`await p`** takes a promise (or any value — a non-promise is wrapped, so `await 5` is `5` one microtask later), suspends the async function, lets the event loop run, and resumes when `p` settles: the fulfilled value becomes the expression's value; a rejection is **thrown** at the `await`. Only valid inside `async` functions and at the top level of ES modules.

Everything before the first `await` runs synchronously when the function is called; the function returns its promise at the first `await`. After each `await` the continuation runs as a microtask.

## Sequential or concurrent — you decide

```js
// sequential: ~600 ms total if each takes 200
const a = await fetchA();
const b = await fetchB();
const c = await fetchC();

// concurrent: ~200 ms — start all three, then wait
const [a2, b2, c2] = await Promise.all([fetchA(), fetchB(), fetchC()]);

// also concurrent, without all(): start first, await later
const pA = fetchA(); const pB = fetchB();
const a3 = await pA; const b3 = await pB;
```

`await` waits for one thing. Independent operations awaited one after another run one after another — the most common performance bug in async code. Start them (call the functions, holding the promises), then await. Dependent operations (`fetchTeam(user.teamId)`) must be sequential by nature.

The same applies to loops: `for (const id of ids) results.push(await load(id))` loads one at a time; `await Promise.all(ids.map((id) => load(id)))` loads all at once. Choose sequential when order or rate matters (writing in order, a rate-limited API), concurrent when it does not; bound the concurrency for large lists (next lesson). `forEach` with an `async` callback awaits **nothing** — the loop finishes immediately and errors are lost; use `for…of` or `map` + `Promise.all`.

## Error handling

```js
async function readConfig(path) {
  try {
    const text = await fs.promises.readFile(path, "utf8");
    return JSON.parse(text);
  } catch (err) {
    if (err.code === "ENOENT") return {};                     // expected: missing file → defaults
    throw new ConfigError(`cannot load ${path}`, { cause: err });   // otherwise wrap and propagate
  } finally {
    metrics.increment("config.read");
  }
}
```

A rejected `await` throws at that line, so `try`/`catch` covers asynchronous failures exactly like synchronous ones — including errors from several awaited steps in one block. The module-7 rules apply unchanged: catch at boundaries, guard types, wrap with `cause`.

The trap: `try { return doWork(); } catch …` — returning a promise **without awaiting** exits the `try` before the promise rejects; the `catch` never fires and the caller gets the rejection. Inside a `try` (or when `finally` cleanup must wait), write `return await doWork()`. Elsewhere a bare `return doWork()` is fine and saves a microtask.

## The missing `await`

`const data = fetchData();` (no `await`) gives a promise, so `data.items` is `undefined` — the classic "Cannot read properties of undefined". `fetchData();` as a statement with no `await` and no `catch` is a **floating promise**: its work runs, its result is dropped, and its rejection is unhandled (a crash in Node). Linters (`@typescript-eslint/no-floating-promises`) exist for this. Every promise must be awaited, returned, or explicitly handled (`void p.catch(log)` when fire-and-forget is intended).

## Concurrency without threads

An `async` function's body runs in slices between `await`s; no other JavaScript runs *during* a slice, but other code runs *between* slices. Shared state read before an `await` may have changed after it:

```js
if (!cache.has(key)) {                      // two callers both see "missing"
  const value = await load(key);            // both load
  cache.set(key, value);
}
```

Fix by caching the **promise** (`cache.set(key, load(key))` before awaiting) or with an explicit lock/queue. Check-then-act across an `await` is the async race condition.

## Top-level `await` and startup

In ES modules `await` works at module top level (Node 14.8+), which makes `const config = await loadConfig();` in an entry module legal and makes module evaluation asynchronous — importers wait. In CommonJS (`require`) it is a syntax error; wrap in an `async function main()` and call `main().catch((err) => { console.error(err); process.exit(1); })` — the standard entry pattern that also handles startup failures.

## Under the hood

`async`/`await` desugars to a generator-like state machine driven by promises: each `await` is a `yield` of the promise to a driver that resumes the function with the settled value in a `then` callback. That is why continuations are microtasks, why `await` on an already-fulfilled promise still yields once, and why stack traces across `await` need V8's async-stack-trace reconstruction.

## Common mistakes

- Sequential awaits for independent work; `forEach(async …)`.
- Missing `await`: reading a promise as a value, or a floating promise with an unhandled rejection.
- `return promise` inside `try` — the `catch` cannot see the rejection.
- `await` inside a non-async callback (`arr.map((x) => await f(x))` is a syntax error; mark the callback `async`).
- Assuming nothing changes across an `await` (check-then-act races).
- Wrapping an async function in `new Promise` — it already returns one.

## Interview angle

- *"What does `async` do to a function?"* Makes it return a promise; `return` fulfils, `throw` rejects.
- *"What does `await` do?"* Suspends the async function until the promise settles, yielding to the event loop; resumes with the value or throws the rejection.
- *"How do you run async operations concurrently with `await`?"* Start them first (or `map` to promises), then `await Promise.all`.
- *"`return promise` versus `return await promise`?"* Inside `try`/`finally` only `return await` lets the block see the rejection; elsewhere both are fine.
- *"Why does `forEach(async …)` not work?"* `forEach` ignores the returned promises; nothing waits and errors are lost.

## Key takeaways

- `async` → returns a promise; `await` → pause, yield, resume with the value or throw the rejection; continuations are microtasks.
- Sequential awaits are sequential; start independent work first, then `await Promise.all`; never `forEach(async)`.
- `try`/`catch`/`finally` work across awaits; `return await` inside `try`; wrap with `cause`, catch at boundaries.
- Every promise is awaited, returned, or handled — a floating promise is a bug and, on rejection, a crash.
- State can change across an `await`: cache promises, not values; check-then-act needs a lock.
