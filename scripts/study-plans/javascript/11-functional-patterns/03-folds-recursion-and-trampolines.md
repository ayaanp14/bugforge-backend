---
title: Folds, recursion and trampolines — reduce as the universal loop
minutes: 12
---
Every list operation is a **fold**: walk the elements, carry an accumulator, produce a result. `reduce` is the fold; `map`, `filter`, `flatMap`, `groupBy`, `partition`, `zip`, `unique` and `sum` are all `reduce` with a particular accumulator, and being able to write each of them in one line is the difference between using the array methods and understanding them. Recursion is the other universal loop, and JavaScript has one hard limit on it — no tail-call elimination in V8 — which this lesson addresses with the two standard escapes: rewrite as a loop, or trampoline. It closes with the honest comparison: when a fold clarifies, when a loop is simply better, and how to avoid the O(n²) trap that lurks in "elegant" immutable reduces.

## Everything is a fold

```js
const map = (f, xs) => xs.reduce((acc, x) => (acc.push(f(x)), acc), []);
const filter = (p, xs) => xs.reduce((acc, x) => (p(x) ? acc.push(x) : 0, acc), []);
const flatMap = (f, xs) => xs.reduce((acc, x) => acc.concat(f(x)), []);
const groupBy = (key, xs) => xs.reduce((acc, x) => { (acc[key(x)] ??= []).push(x); return acc; }, {});
const partition = (p, xs) => xs.reduce(([yes, no], x) => (p(x) ? yes.push(x) : no.push(x), [yes, no]), [[], []]);
const zip = (xs, ys) => xs.reduce((acc, x, i) => (i < ys.length ? (acc.push([x, ys[i]]), acc) : acc), []);
const unique = (xs) => xs.reduce((acc, x) => (acc.includes(x) ? acc : (acc.push(x), acc)), []);   // O(n²) — use a Set
const countBy = (key, xs) => xs.reduce((m, x) => m.set(key(x), (m.get(key(x)) ?? 0) + 1), new Map());
const indexBy = (key, xs) => new Map(xs.map((x) => [key(x), x]));
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const maxBy = (f, xs) => xs.reduce((best, x) => (best === undefined || f(x) > f(best) ? x : best), undefined);
const pipeline = (fns, x) => fns.reduce((acc, f) => f(acc), x);            // pipe is a fold too
```

Two things to notice. The accumulator is **mutated** in most of these (`acc.push`, `m.set`) — that is fine and fast because the accumulator was created by this very `reduce` and nobody else sees it until it is returned; the *function* stays pure. And each has a **seed**; without one `reduce` uses the first element and throws on an empty array.

## The O(n²) trap

```js
xs.reduce((acc, x) => [...acc, f(x)], []);              // copies the whole accumulator every step: O(n²)
xs.reduce((acc, x) => ({ ...acc, [x.id]: x }), {});      // same
```

Spreading the accumulator "to stay immutable" allocates n arrays of growing size — 10 000 items become 50 million element copies. Mutate the local accumulator (`acc.push`) or use `Object.fromEntries(xs.map(...))`/`new Map(...)`. Immutability matters at the boundary of a function, not inside its own scratch space.

## `reduceRight`, and folds over other shapes

`reduceRight` folds from the end — used for `compose`, for building a right-nested structure, or for processing a list in reverse without copying. Folds are not only for arrays: a tree fold visits nodes recursively with an accumulator; a Map/Set can be folded with `for…of` or `[...map].reduce`; a generator can be folded lazily by a consuming loop.

## Recursion

```js
const depth = (node) => (node.children.length ? 1 + Math.max(...node.children.map(depth)) : 1);
const flatten = (xs) => xs.flatMap((x) => (Array.isArray(x) ? flatten(x) : [x]));
const permutations = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
```

Recursion is the natural fit for **recursive data** — trees, nested arrays, JSON, expression grammars — and for divide-and-conquer. Every recursive function has a base case (the smallest input, answered directly) and a recursive case (a smaller input plus one step). Write the base case first.

## The stack limit and the missing tail calls

Each call uses a stack frame; V8's default stack holds roughly ten thousand frames before `RangeError: Maximum call stack size exceeded`. Many languages eliminate frames for **tail calls** — a call in return position needs no frame to return to — and ES2015 specified it, but V8 (and every other major engine except Safari) never shipped it. So `const sum = (n, acc = 0) => n === 0 ? acc : sum(n - 1, acc + n)` overflows at large `n` in Node regardless of being tail-recursive.

Two escapes:

1. **Rewrite as a loop.** Any tail-recursive function converts mechanically: the parameters become variables, the recursive call becomes reassignment inside `while`. This is the right answer for linear recursion over big inputs.
2. **Trampoline.** Return a *thunk* (a zero-argument function describing the next call) instead of calling; a driver loop keeps calling until a non-function comes back. The recursion becomes iteration without changing the function's shape:

```js
const trampoline = (f) => (...args) => {
  let result = f(...args);
  while (typeof result === "function") result = result();    // each bounce is a fresh, shallow call
  return result;
};
const sumTo = trampoline(function go(n, acc = 0) {
  return n === 0 ? acc : () => go(n - 1, acc + n);            // return the NEXT step, do not make it
});
sumTo(1_000_000);                                             // 500000500000, no overflow
```

Trampolines cost an allocation per step and only handle tail calls; for tree recursion (two recursive calls whose results combine) use an explicit stack or queue instead. Depth-first over a tree with an explicit stack array is the standard iterative form.

## Fold versus loop, honestly

A `reduce` is right when the operation *is* a fold that reads as one idea: sum, max, group, index, pipe. It is wrong — for readers — when the callback grows past four or five lines, mixes several accumulators, or needs early exit (`reduce` cannot `break`; `for…of` can, and so can `some`/`find`). Performance: a well-written `for` loop is faster than `reduce` by a small constant; nested spreads in a `reduce` are catastrophically slower. Choose by readability first, then measure.

## Common mistakes

- `reduce` without a seed on possibly-empty input.
- `[...acc, x]` / `{ ...acc, k }` inside `reduce` — O(n²).
- Recursion on large linear inputs without a loop or trampoline; expecting tail-call optimisation in Node.
- `unique` via `includes` (O(n²)) instead of a `Set`.
- Forcing early-exit logic into `reduce` with a flag instead of using a loop, `some` or `find`.
- A recursive function whose base case is unreachable for some inputs (negative numbers, empty arrays).

## Interview angle

- *"Implement `map` using `reduce`."* `xs.reduce((acc, x) => (acc.push(f(x)), acc), [])`.
- *"Why is `reduce((acc, x) => [...acc, x], [])` slow?"* Copies the accumulator each step — O(n²).
- *"Does JavaScript have tail-call optimisation?"* Specified in ES2015, but V8 does not implement it; use a loop or a trampoline.
- *"What is a trampoline?"* A driver that repeatedly calls returned thunks, turning tail recursion into iteration with constant stack.
- *"When would you not use `reduce`?"* Long callbacks, several accumulators, or early exit — a loop reads better and can `break`.

## Key takeaways

- `map`, `filter`, `flatMap`, `groupBy`, `partition`, `zip`, `countBy`, `pipe` — all folds over `reduce` with a seed; mutate the local accumulator.
- Never spread the accumulator inside `reduce`; `Set`/`Map` for uniqueness and lookup.
- Recursion for recursive data; base case first; V8 has ~10k frames and no tail calls.
- Linear recursion → loop; tail recursion → trampoline (thunks + driver); tree recursion → explicit stack.
- Fold when it reads as one idea; loop when it needs `break`, several accumulators or speed.
