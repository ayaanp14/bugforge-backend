---
title: Generators — functions that pause, and lazy pipelines
minutes: 14
---
A generator is a function that can **pause** at `yield`, hand a value out, and later resume exactly where it stopped with all its local variables intact. Call it and nothing runs; you get a generator object that is both an iterator and an iterable. That makes generators the shortest way to implement the iteration protocol — a range, a tree walk, an infinite sequence in three lines — and the natural way to build **lazy pipelines**: `filter`, `map` and `take` that touch only the items actually consumed. They also run backwards: `next(value)` sends data *into* the paused function, which is how coroutines, state machines and (historically) `async`/`await` were built. This lesson covers the syntax, the protocol, delegation with `yield*`, the pipeline toolkit, and where generators earn their keep.

## The syntax and the protocol

```js
function* countdown(n) {
  while (n > 0) yield n--;
  return "done";                          // the value of the final { done: true } result
}
const g = countdown(3);                   // nothing has run yet
g.next();     // { value: 3, done: false }
g.next();     // { value: 2, done: false }
g.next();     // { value: 1, done: false }
g.next();     // { value: "done", done: true }
g.next();     // { value: undefined, done: true } — forever after

[...countdown(3)];                        // [3, 2, 1] — return value is not part of the sequence
for (const n of countdown(3)) { }
```

`function*` (or `*method()` in a class/object, or `async function*`) marks a generator; arrows cannot be generators. Each `next()` runs the body until the next `yield`, whose operand becomes `value`. A `return` (or falling off the end) sets `done: true`. Generator objects are single-use, like every iterator.

## Infinite sequences and `take`

```js
function* naturals() { let n = 1; while (true) yield n++; }
function* take(n, it) { for (const x of it) { if (n-- <= 0) return; yield x; } }
[...take(5, naturals())];                 // [1, 2, 3, 4, 5]
```

Infinite loops are fine inside a generator because the loop only advances when someone calls `next()`. The consumer decides how much to compute — `take` stops pulling, and `for…of` in `take` calls the source's `return()` on the way out.

## Lazy pipelines

```js
function* map(fn, it) { for (const x of it) yield fn(x); }
function* filter(pred, it) { for (const x of it) if (pred(x)) yield x; }

const pipeline = take(3, map((x) => x * x, filter((x) => x % 2, naturals())));
[...pipeline];                            // [1, 9, 25] — only 5 naturals were ever generated
```

Each stage pulls from the one below it only when pulled itself. Compared with `arr.filter().map().slice(0, 3)`: no intermediate arrays, works on infinite or streaming sources, and stops at the first three results instead of processing everything. For a small in-memory array, the array methods are simpler and faster; for large, lazy or infinite data, generators win. Node 22's iterator helpers (`it.filter().map().take()`) are exactly these functions as methods; on Node 16 you write them once.

## `yield*` — delegation

```js
function* flatten(tree) {
  for (const node of tree) {
    if (Array.isArray(node)) yield* flatten(node);      // hand control to the inner generator
    else yield node;
  }
}
[...flatten([1, [2, [3, [4]]], 5])];      // [1, 2, 3, 4, 5]

function* chain(...its) { for (const it of its) yield* it; }     // works on ANY iterable
[...chain("ab", [1, 2], new Set([3]))];   // ["a", "b", 1, 2, 3]
```

`yield* inner` yields every value of `inner` as if written inline, forwards `next(value)`/`return()`/`throw()` into it, and evaluates to `inner`'s return value. Recursive tree traversals become a few lines; without `yield*` you would loop and re-yield by hand.

## Sending values in: `next(value)`

```js
function* average() {
  let sum = 0, count = 0;
  while (true) {
    const x = yield count ? sum / count : 0;     // yield gives out the current average and receives the next number
    sum += x; count++;
  }
}
const avg = average();
avg.next();        // prime: runs to the first yield, value 0 (the argument to the first next() is ignored)
avg.next(10).value;   // 10
avg.next(20).value;   // 15
```

The argument to `next(v)` becomes the value of the `yield` expression the generator is paused on. The first `next()` has no paused `yield` to deliver to, so its argument is dropped — hence the priming call. `gen.return(v)` finishes the generator early (running `finally` blocks) and `gen.throw(err)` raises inside it at the paused `yield` — the two channels that make generators full coroutines, and the foundation of the pre-2017 `async` libraries (`co`, redux-saga).

## Generators as class iterables

```js
class Tree {
  constructor(value, children = []) { this.value = value; this.children = children; }
  *[Symbol.iterator]() {                          // depth-first, pre-order
    yield this.value;
    for (const c of this.children) yield* c;
  }
  *breadthFirst() {
    const queue = [this];
    while (queue.length) { const n = queue.shift(); yield n.value; queue.push(...n.children); }
  }
}
```

A generator method is the idiomatic way to make a class iterable when the sequence is computed rather than stored — and to offer several orders (`breadthFirst()`) as plain methods.

## `try`/`finally` and cleanup

Code after a `yield` may never run if the consumer stops early — put cleanup in `finally`; `for…of`'s `break` calls `return()`, which runs it. A generator holding a file handle or a lock should always be structured `try { yield … } finally { release() }`.

## Async generators, briefly

`async function*` yields promises' resolved values and is consumed with `for await (const x of gen())` — the pattern for paginated APIs, streams and line-by-line file reading. Module 8 covers them with promises; the mechanics are the ones here plus `await`.

## Common mistakes

- Expecting the body to run at call time; it runs at the first `next()`.
- Reusing a generator object for a second loop (single-use); call the generator function again.
- Forgetting the priming `next()` when sending values in.
- Spreading an infinite generator.
- Returning a value and expecting it in `[...gen]` — return values are not yielded.
- Arrow functions with `*` (syntax error) or `yield` inside a nested normal function (it is not the generator).

## Interview angle

- *"What is a generator?"* A function that pauses at `yield` and resumes on `next()`, producing an iterator lazily.
- *"Implement `take(n, iterable)`."* A generator with a counter that `return`s when the count runs out.
- *"Why lazy?"* Compute only what is consumed; works on infinite and streaming sources; no intermediate arrays.
- *"What does `yield*` do?"* Delegates to another iterable, yielding its values and forwarding `next/return/throw`.
- *"How do you send a value into a generator?"* `gen.next(v)` — it becomes the value of the paused `yield`; prime first.

## Key takeaways

- `function*` + `yield`: the body runs on `next()`, pausing at each `yield`; `return` ends it; generator objects are single-use iterators and iterables.
- Infinite sequences are fine; `take`/`map`/`filter` generators make lazy pipelines that compute only what is consumed.
- `yield*` delegates (recursion, chaining any iterables) and forwards the protocol.
- `next(v)` sends values in (prime first); `return`/`throw` finish or raise inside; `finally` for cleanup.
- Generator methods are the idiomatic class iterable; async generators pair with `for await`.
