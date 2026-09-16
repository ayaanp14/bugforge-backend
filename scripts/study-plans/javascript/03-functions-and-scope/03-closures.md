---
title: Closures — functions that remember
minutes: 14
---
A closure is a function together with the variables it can see from where it was defined. Every JavaScript function is one; the word matters when the function *outlives* the scope it was born in and keeps that scope alive — a counter that remembers its count, an event handler that remembers which button it belongs to, a memoised function that remembers past results. Closures are how JavaScript does private state, configuration, callbacks and modules, and they are the single most-asked concept in JavaScript interviews. This lesson builds them from the scope chain and covers the patterns and the two classic pitfalls.

## The mechanism

```js
function makeGreeter(greeting) {
  return function (name) {              // created inside makeGreeter's scope…
    return `${greeting}, ${name}!`;     // …and it reads greeting from that scope
  };
}
const hi = makeGreeter("Hi");
const yo = makeGreeter("Yo");
hi("Ada");   // "Hi, Ada!"
yo("Ada");   // "Yo, Ada!"
```

Each call to `makeGreeter` creates a new scope with its own `greeting`; the returned function holds a reference to *that* scope. Two calls, two independent closures. The inner function does not copy `greeting` — it references the live binding, so if the outer scope later changes the variable, the closure sees the change:

```js
function counter() {
  let n = 0;
  return { inc: () => ++n, get: () => n };    // two closures over the same n
}
const c = counter();
c.inc(); c.inc(); c.get();   // 2 — inc and get share one live n
```

## Private state

Before `#private` fields existed, this was *the* way to hide data, and it remains the lightest:

```js
function makeAccount(opening) {
  let balance = opening;                                // unreachable from outside
  return {
    deposit(amount) { if (amount > 0) balance += amount; return balance; },
    withdraw(amount) { if (amount <= balance) balance -= amount; return balance; },
    balance: () => balance,
  };
}
const acct = makeAccount(100);
acct.deposit(50);          // 150
acct.balance;              // a function, not the variable — the variable is not exposed at all
```

Nothing can reach `balance` except through the methods. The pattern is called the **module pattern** (or a factory function) and it scales from a counter to a whole library.

## Configuration and partial application

```js
const multiplier = (k) => (x) => x * k;
const double = multiplier(2), triple = multiplier(3);
[1, 2, 3].map(double);               // [2, 4, 6]

const logAt = (level) => (msg) => console.log(`[${level}] ${msg}`);
const warn = logAt("WARN");
```

A function that takes some arguments now and returns a function that takes the rest is **partial application**; when every argument is taken one at a time it is **currying**. Both are closures over the earlier arguments. `bind` (next lesson) does the same for a fixed `this` and leading arguments.

## Memoisation

```js
function memoize(f) {
  const cache = new Map();
  return (x) => {
    if (!cache.has(x)) cache.set(x, f(x));
    return cache.get(x);
  };
}
const slowSquare = (n) => { /* expensive */ return n * n; };
const fastSquare = memoize(slowSquare);
fastSquare(9); fastSquare(9);      // computed once
```

The `cache` lives in the closure — private, per-memoised-function, alive as long as `fastSquare` is. For several arguments use a key like `JSON.stringify(args)`; for recursion, memoise the recursive function itself so inner calls hit the cache.

## Pitfall one: the loop variable

```js
const fns = [];
for (var i = 0; i < 3; i++) fns.push(() => i);
fns.map((f) => f());        // [3, 3, 3]
```

All three closures capture the **same** `i` (one `var` binding per function), read after the loop finished. Fixes, oldest to newest: an IIFE per iteration `((j) => fns.push(() => j))(i)`; `forEach`, whose callback gets a fresh parameter each time; or simply **`let`**, which gives every iteration its own binding — `[0, 1, 2]`. In modern code the bug cannot happen unless you write `var`.

## Pitfall two: memory

A closure keeps its whole captured scope alive, not just the variables it uses (engines optimise this partly, but do not rely on it). A short callback that closes over a scope holding a large array keeps the array in memory as long as the callback is referenced — by an event emitter, a timer, a cache. The leak shape is "a long-lived thing holds a small function that holds a big scope". Fix by not capturing what you do not need (pass values as parameters), by clearing references when done, and by removing listeners.

## Closures and asynchrony

Every callback you hand to `setTimeout`, `fs.readFile`, a promise `then` or an event listener is a closure — it runs later, and what it sees is the scope it was written in:

```js
function fetchAndLabel(id) {
  const label = `item-${id}`;
  setTimeout(() => console.log(label), 100);   // label still available 100 ms later
}
```

This is the reason asynchronous JavaScript works at all without passing state around by hand.

## Seeing closures in the debugger

Node's inspector and browser devtools show a paused function's **Closure** scope alongside Local and Global — the exact set of outer variables it captured. Watching that panel once makes the concept permanent.

## Interview angle

- *"What is a closure?"* A function plus the lexical scope it was created in; the function can read and write those variables even after the outer function returned.
- *"Give a practical use."* Private state (a counter or account factory), memoisation, configured functions (`multiplier(2)`), every asynchronous callback.
- *"Why does `for (var …)` with callbacks print the last value?"* One shared binding captured by every closure; `let` gives one per iteration.
- *"Do closures capture values or variables?"* Variables (live bindings): a later change in the outer scope is visible inside.
- *"Can closures leak memory?"* Yes — a retained callback retains its whole scope; drop references and remove listeners.

## Key takeaways

- A closure references the live scope where it was defined; each outer call creates a fresh scope.
- Factories with returned methods give private state; configured functions and memoisation are closures over arguments and caches.
- `var` in a loop shares one binding — use `let`.
- Closures keep scopes alive: mind what long-lived callbacks capture.
- Every asynchronous callback is a closure; that is what makes async code carry context for free.
