---
title: Composition, currying and point-free style — building programs from small functions
minutes: 13
---
Once functions are pure, they compose: the output of one is the input of the next, and a program becomes a pipeline of small, named, testable steps. Two mechanical tools make that pleasant in JavaScript — `pipe`/`compose` to chain unary functions, and **currying**/partial application to turn multi-argument helpers into the unary pieces a pipeline wants — plus one design convention, **data-last**, that decides whether a library composes well. This lesson builds the tools, shows the style they enable (including "point-free" code with no named parameters), compares it honestly with method chaining, and marks the places where the style stops helping.

## `pipe` and `compose`

```js
const pipe = (...fns) => (x) => fns.reduce((acc, f) => f(acc), x);        // left to right: pipe(f, g)(x) = g(f(x))
const compose = (...fns) => (x) => fns.reduceRight((acc, f) => f(acc), x); // right to left: compose(f, g)(x) = f(g(x))

const slugify = pipe(
  (s) => s.trim().toLowerCase(),
  (s) => s.replace(/[^a-z0-9]+/g, "-"),
  (s) => s.replace(/^-|-$/g, ""),
);
slugify("  Hello, World! ");   // "hello-world"
```

`pipe` reads in execution order and is what most JavaScript code uses; `compose` matches mathematical notation. Both work only with **unary** functions — each step takes one value — which is why the next two tools exist. A pipeline is a value: store it, pass it, test each step on its own, insert a `tap` (`(x) => { log(x); return x; }`) to inspect the middle.

## Currying and partial application

```js
const curry = (fn) => function curried(...args) {
  return args.length >= fn.length ? fn(...args) : (...more) => curried(...args, ...more);
};
const add = curry((a, b, c) => a + b + c);
add(1)(2)(3); add(1, 2)(3); add(1)(2, 3);   // 6 — all shapes work

const partial = (fn, ...preset) => (...later) => fn(...preset, ...later);
const greetAda = partial(greet, "Hello", "Ada");
```

**Currying** transforms `f(a, b, c)` into `f(a)(b)(c)` — a chain of unary functions, where each call fixes one argument; **partial application** fixes some arguments now and takes the rest later, in one call. Auto-currying (above) accepts arguments in any grouping by comparing against `fn.length` — which is why it breaks on functions with default or rest parameters (they do not count toward `length`) and on variadic functions; state the arity explicitly (`curryN(3, fn)`) in those cases.

## Data-last

```js
const map = curry((fn, xs) => xs.map(fn));
const filter = curry((pred, xs) => xs.filter(pred));
const sortBy = curry((key, xs) => [...xs].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0)));
const take = curry((n, xs) => xs.slice(0, n));

const topAdults = pipe(filter((u) => u.age >= 18), sortBy("age"), map((u) => u.name), take(3));
topAdults(users);
```

Put the **configuration first and the data last**: `map(fn, xs)` not `map(xs, fn)`. Then partially applying the configuration yields exactly the unary function a pipeline needs, and the same `topAdults` works on any array. Lodash's `_.map(xs, fn)` is data-first (chain-friendly, `lodash/fp` flips it); Ramda and `lodash/fp` are data-last by design. If you write utilities meant to compose, make them data-last and curried.

## Point-free style

"Point-free" (tacit) code names no arguments: `const names = map(prop("name"))` instead of `(users) => users.map((u) => u.name)`. It removes noise when the functions have good names — `pipe(trim, toLower, slugify)` — and adds a puzzle when they do not: `compose(map(compose(add(1), multiply(2))), filter(complement(isNil)))` reads worse than a two-line arrow. Use it for straight pipelines of well-named steps; write the arrow when an argument name would help the reader. `Array.prototype.map(parseInt)` is the cautionary tale: point-free with a function that takes more arguments than you think.

## Small combinators worth having

```js
const identity = (x) => x;
const constant = (v) => () => v;
const tap = (f) => (x) => { f(x); return x; };
const prop = (k) => (o) => o[k];
const not = (pred) => (...a) => !pred(...a);
const flip = (f) => (a, b) => f(b, a);
const unary = (f) => (x) => f(x);                // fixes .map(parseInt)
const juxt = (...fns) => (x) => fns.map((f) => f(x));   // apply several functions to one value
const once = (f) => { let done = false, r; return (...a) => (done ? r : ((done = true), (r = f(...a)))); };
```

Each is five to ten characters of logic and saves an inline arrow at every use.

## Pipelines versus method chains

`xs.filter(p).map(f).slice(0, 3)` is already a pipeline — for arrays, chaining is idiomatic and often clearer, and it needs no library. `pipe` wins when the steps are not array methods (string transforms, domain functions, validation), when you want to **reuse** the composed function, when steps come from different modules, or when the data is not an array (a single record, a promise via `pipeP`/async steps). Many codebases use both: method chains inside steps, `pipe` between steps. JavaScript's pipeline operator (`|>`) remains a proposal.

## Async composition

`const pipeAsync = (...fns) => (x) => fns.reduce((p, f) => p.then(f), Promise.resolve(x));` — each step may be sync or async; the result is a promise. Error handling is the promise chain's: one `catch` at the end, or a `Result`-returning style (lesson 5).

## When to stop

Composition shines for **transformations of data**: parsing, normalising, filtering, reporting. It fights you for stateful, event-driven, or performance-critical code — a game loop, a socket handler, a tight numeric kernel — where a plain loop with mutable locals is clearer and faster. A curried, point-free, five-combinator expression that takes a minute to decode has failed the reader; the test of a functional style is that the *next* developer finds it obvious.

## Common mistakes

- Composing non-unary functions; `compose` when `pipe` order was intended.
- Auto-curry on functions with defaults/rest parameters (`length` is wrong) or on variadic functions.
- Data-first helpers in a pipeline (nothing partially applies cleanly).
- Point-free with functions that take extra arguments (`map(parseInt)`).
- Rewriting an obvious `for` loop into a compose tower for style points.
- Forgetting that a pipeline of arrays allocates per step — fine normally, measure on hot paths.

## Interview angle

- *"Implement `pipe` and `compose`."* `reduce`/`reduceRight` over the functions with the value as accumulator.
- *"Currying versus partial application?"* Currying turns an n-ary function into a chain of unary calls; partial application fixes some arguments in one call.
- *"Why data-last?"* So partially applying the configuration yields a unary function that composes.
- *"What is point-free style, and when is it bad?"* Code without named arguments; bad when the combinator soup is harder to read than an arrow.
- *"How does `curry` know when to call the function?"* It compares collected arguments to `fn.length` — which fails for defaults, rest and variadics.

## Key takeaways

- `pipe` (left→right) and `compose` (right→left) chain unary functions with `reduce`; pipelines are values you can store, reuse and `tap`.
- Curry to get unary steps from multi-argument helpers; partial application fixes leading arguments; watch `fn.length`.
- Data-last, curried utilities compose; data-first ones chain.
- Point-free for clean pipelines of well-named functions; arrows when a parameter name helps.
- Use composition for data transformation; loops and mutable locals for stateful or hot code.
