---
title: Promises — a value that is not here yet
minutes: 14
seo-title: JavaScript Promises Explained: Then, Catch and Chaining
description: A JavaScript promise is pending, then fulfilled or rejected, exactly once. What then returns, how rejections reach catch, and the unhandled rejection crash.
question: What is a promise in JavaScript?
answer: A promise in JavaScript is an object standing in for a result that arrives later. It starts pending and settles exactly once, either fulfilled with a value or rejected with a reason. Handlers attached with `then` and `catch` always run asynchronously as microtasks, even on a promise that has already settled, and each `then` returns a new promise, which is what lets chains compose.
q: What does `then` return in JavaScript?
a: A new promise, settled by what the handler does: return a value and it fulfils with that value; return a promise and it waits for and adopts that promise's outcome; throw and it rejects. A handler that starts asynchronous work but forgets to `return` it lets the chain run ahead with `undefined`.
q: What is the difference between `then(ok, fail)` and `then(ok).catch(fail)`?
a: With `then(ok, fail)`, `fail` does not see errors thrown inside `ok`, because both handlers belong to the same step. With `then(ok).catch(fail)`, `fail` catches a rejection of the original promise and any error thrown in `ok`, which is why the second form is preferred.
q: What is an unhandled promise rejection?
a: It is a promise that rejects with no handler attached. Node prints a warning and, since Node 15, crashes the process by default; browsers fire an `unhandledrejection` event. End every chain in a `catch`, or return the promise to a caller that will handle it.
q: How do you convert a callback function to a promise?
a: In Node, `util.promisify(fn)` turns an error-first callback function into one that returns a promise, and most of `fs` already has an `fs.promises` version. Otherwise wrap the call in `new Promise((resolve, reject) => …)` and resolve or reject from inside the callback.
q: What is the explicit promise construction antipattern?
a: It is wrapping code that already returns promises in `new Promise(…)`. The wrapper adds nothing and is easy to get wrong, for example by never passing on a rejection; return or chain the existing promise instead. Keep `new Promise` for wrapping callback- or event-based APIs such as `setTimeout` or `emitter.once`.
---
A promise is an object standing in for a result that will arrive later: it is **pending**, then either **fulfilled** with a value or **rejected** with a reason, exactly once, forever. Everything else — `then`, chaining, `catch`, `async`/`await` — is built on that one idea. Promises fixed what callbacks could not: a result you can hold, pass around and attach to after the fact; errors that propagate along a chain to one `catch`; and composition operators (`all`, `race`) that work on any asynchronous operation. This lesson covers the state machine, the chaining rules that trip people up (return!), how rejections travel, how to build promises around callback code, and the mistakes that show up in code review every week.

## States and settling

```js
const p = new Promise((resolve, reject) => {     // the executor runs synchronously, right now
  setTimeout(() => resolve(42), 100);            // later: settle it
});
p.then((v) => console.log(v));                   // 42, when it settles — and this callback ALWAYS runs asynchronously
```

A promise settles once: further `resolve`/`reject` calls are ignored. Reactions attached with `then` run as **microtasks** — even if the promise is already settled, the callback runs after the current synchronous code finishes. That guarantee ("always async") is what makes ordering predictable. The value a promise holds can be anything except another promise: resolving with a promise (or any object with a `then` method — a *thenable*) **adopts** its state instead, which is why chains flatten.

## `then` returns a new promise — the chaining rules

```js
fetchUser(id)
  .then((user) => user.teamId)                 // return a value → the next promise fulfils with it
  .then((teamId) => fetchTeam(teamId))         // return a PROMISE → the next promise waits for and adopts it
  .then((team) => { console.log(team.name); }) // return nothing → the next promise fulfils with undefined
  .catch((err) => console.error(err))          // any rejection above lands here
  .finally(() => hideSpinner());               // runs either way, receives nothing, passes the outcome through
```

Each `then(onFulfilled, onRejected)` returns a **new** promise settled by what the handler does: return a value → fulfil with it; return a promise/thenable → follow it; throw → reject with the thrown value. This is the whole algebra. The single most common bug is a handler that *does* asynchronous work but forgets to **return** the promise: the chain moves on immediately with `undefined`, and the error from the un-returned promise is unhandled.

`catch(fn)` is `then(undefined, fn)`; a rejection skips every `then` handler down to the first `catch`; a `catch` that returns a value **recovers** — the chain continues fulfilled. `finally(fn)` runs on either outcome and, unless it throws or returns a rejected promise, is transparent to the value.

## Errors: throw, reject, propagate

Inside an executor or a `then` handler, `throw` is the same as rejecting. Rejections propagate along the chain until handled. A promise that rejects with **no handler attached** is an *unhandled rejection*: Node prints a warning and (since Node 15) **crashes the process** by default; browsers fire `unhandledrejection`. Every chain you create must end in a `catch` or be returned to someone who will handle it. Reject with `Error` objects, for the same reasons you throw them.

Two handlers in one `then` versus `then`/`catch` differ: `then(ok, fail)` — `fail` does **not** see errors thrown by `ok`; `then(ok).catch(fail)` — it does. Prefer the latter.

## Creating promises

- `new Promise(executor)` — only when wrapping something callback- or event-based. If you find yourself writing `new Promise` around code that already returns promises, stop: that is the *explicit-construction antipattern*.
- `Promise.resolve(v)` — a fulfilled promise (or `v` itself if it is already a promise; a thenable is adopted). `Promise.reject(err)`.
- `util.promisify(fn)` (Node) — turns an error-first callback function into a promise-returning one; most of `fs` has a `fs.promises` version already.
- An `async` function — returns a promise automatically (next lesson).

```js
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function once(emitter, event) {
  return new Promise((resolve, reject) => {
    emitter.once(event, resolve);
    emitter.once("error", reject);
  });
}
```

## A promise is a value

You can store it, return it, pass it, attach handlers any number of times and at any time — even years after it settled — and every handler gets the same result. Start an operation *now* and await it *later*: `const userP = fetchUser(id); const teamP = fetchTeam(tid); const [user, team] = await Promise.all([userP, teamP]);` runs both concurrently. Cache the promise, not the value, to dedupe concurrent requests for the same resource (`cache.get(key) ?? cache.set(key, load(key)).get(key)`).

## Anatomy of a hand-written `then` (for understanding)

A promise keeps its state, its value, and a list of reactions. `then` pushes `{ onFulfilled, onRejected, resolveNext, rejectNext }` onto that list and returns the next promise. When the promise settles, each reaction is queued as a microtask that calls the appropriate handler and settles the next promise from the handler's return or throw — with the adoption rule for returned thenables. Thirty lines implement it; the "Promises/A+" test suite has 800 cases for the corners. You will not write one in production, but interviewers ask for a minimal version and the exercise in this lesson makes you trace the rules by hand.

## Common mistakes

- Forgetting to `return` a promise from inside `then` — the chain runs ahead; the error is unhandled.
- Nesting `then` inside `then` instead of returning and chaining flat.
- No terminal `catch` (unhandled rejection crashes Node).
- `new Promise` around promise-returning code; `resolve` called with a callback-style `(err, value)` pair.
- Expecting `then` callbacks to run synchronously for already-settled promises.
- Using `then(ok, fail)` and missing errors thrown in `ok`.
- Rejecting with strings.

## Interview angle

- *"What are the states of a promise?"* Pending, fulfilled, rejected; settles once; reactions run as microtasks.
- *"What does `then` return?"* A new promise settled by the handler's return value (adopting a returned promise) or thrown error.
- *"Difference between `then(ok, fail)` and `then(ok).catch(fail)`?"* Only the second catches errors thrown inside `ok`.
- *"What is an unhandled rejection?"* A rejected promise with no handler; Node exits on it by default.
- *"How do you convert a callback API to promises?"* `util.promisify` or `new Promise` wrapping the callback, resolving/rejecting from it.

## Key takeaways

- Pending → fulfilled/rejected, once; `then` handlers always run asynchronously as microtasks.
- `then` returns a new promise; return a value to pass it on, a promise to wait for it, throw to reject; **always return** the inner promise.
- Rejections skip to the nearest `catch`; recovery continues the chain; end every chain in `catch` or return it.
- Create with `new Promise` only around callbacks/events; `Promise.resolve`, `promisify`, `async` functions otherwise.
- A promise is a value: start now, await later, cache the promise to dedupe.
