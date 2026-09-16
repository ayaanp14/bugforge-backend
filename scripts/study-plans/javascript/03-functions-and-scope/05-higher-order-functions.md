---
title: Higher-order functions — composition, currying and callbacks
minutes: 13
---
Once functions are values, a whole style of programming opens: build small functions, then combine them with other functions. `map`, `filter` and `reduce` are the everyday examples; `compose`, `pipe`, `curry`, `debounce` and `once` are the ones you write yourself. This lesson is that style — how to think in functions that take and return functions, the idioms that recur across every codebase, and the callback convention that predates promises and still underlies Node.

## The array trio, as higher-order functions

```js
const prices = [5, 12, 30];
prices.map((p) => p * 1.2);                    // transform each: [6, 14.4, 36]
prices.filter((p) => p > 10);                  // keep some: [12, 30]
prices.reduce((sum, p) => sum + p, 0);         // fold to one value: 47
prices.some((p) => p > 20); prices.every((p) => p > 0);
prices.find((p) => p > 10); prices.findIndex((p) => p > 10);
```

Each takes a function and applies it for you — the loop is inside the method. The callback receives `(element, index, array)`; using only the first argument is normal. Pass **named functions** for anything longer than one expression: `orders.filter(isPaid).map(toSummary)` reads as a sentence. Module 4 covers the toolkit in depth; here the point is the shape: *a function that takes a function*.

## Functions that return functions

```js
const greaterThan = (n) => (x) => x > n;
[1, 5, 10].filter(greaterThan(4));             // [5, 10]

const pluck = (key) => (obj) => obj[key];
users.map(pluck("email"));

const once = (f) => { let done = false, result; return (...a) => done ? result : (done = true, result = f(...a)); };
const init = once(() => expensiveSetup());     // runs at most once
```

A function returning a configured function is the closure pattern from two lessons ago, used as a **factory of behaviour**. It turns "a comparison" or "a property access" into a value you can hand to `filter` or `map`.

## Composition: `compose` and `pipe`

```js
const compose = (...fns) => (x) => fns.reduceRight((acc, f) => f(acc), x);   // right to left, like maths
const pipe = (...fns) => (x) => fns.reduce((acc, f) => f(acc), x);           // left to right, like a shell

const trim = (s) => s.trim();
const lower = (s) => s.toLowerCase();
const slug = (s) => s.replace(/\s+/g, "-");
const slugify = pipe(trim, lower, slug);
slugify("  Hello World ");                      // "hello-world"
```

`pipe(f, g, h)(x)` is `h(g(f(x)))`. Each step is a small pure function you can test alone; the pipeline names the whole transformation. Prefer `pipe` in application code — people read left to right.

## Currying and partial application

```js
const add = (a) => (b) => a + b;              // curried by hand
add(2)(3);                                    // 5
const add2 = add(2);

const curry = (f) => function curried(...args) {
  return args.length >= f.length ? f(...args) : (...more) => curried(...args, ...more);
};
const volume = curry((l, w, h) => l * w * h);
volume(2)(3)(4); volume(2, 3)(4); volume(2, 3, 4);   // 24 each

const partial = (f, ...fixed) => (...rest) => f(...fixed, ...rest);
const greet = (greeting, name) => `${greeting}, ${name}`;
const hello = partial(greet, "Hello");         // hello("Ada")
```

**Currying** turns an n-argument function into n one-argument functions; **partial application** fixes some arguments now. Both let you create specialised functions from general ones without writing wrappers by hand — and both depend on `f.length`, which counts declared parameters (defaults and rest excluded).

## Timing wrappers: `debounce` and `throttle`

```js
const debounce = (f, ms) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => f(...args), ms); };
};
const throttle = (f, ms) => {
  let last = 0;
  return (...args) => { const now = Date.now(); if (now - last >= ms) { last = now; f(...args); } };
};
```

`debounce` runs `f` only after calls stop for `ms` (search-as-you-type); `throttle` runs at most once per `ms` (scroll handlers). Both are closures over a timer or a timestamp — higher-order functions solving an asynchronous problem with no library.

## The callback convention

Before promises, Node expressed "later" with callbacks and one rule: **error first**.

```js
fs.readFile("data.txt", "utf8", (err, text) => {
  if (err) return handle(err);
  use(text);
});
```

The callback is the last argument; its first parameter is an error or `null`; you check it first and return. Nested callbacks produced the "pyramid of doom" that promises (module 8) fixed, but the convention survives in Node's APIs, event emitters and many libraries — `util.promisify` converts an error-first function into a promise-returning one. Two rules when writing your own: call the callback **exactly once**, and call it **asynchronously** even if the result is ready, so callers cannot observe two different orders.

## Higher-order pitfalls

- **Passing methods**: `arr.map(obj.method)` loses `this` (previous lesson); pass `(x) => obj.method(x)`.
- **`parseInt` in `map`**: `["1", "2", "3"].map(parseInt)` gives `[1, NaN, NaN]` because `map` passes the index as the radix. `.map(Number)` or `.map((s) => parseInt(s, 10))`.
- **Side effects in `map`**: `map` that ignores its result should be `forEach`; `forEach` that builds a result should be `map` or `reduce`. Match the method to the intent.
- **Over-abstraction**: a `pipe` of eight one-liners can be less readable than a ten-line function. Compose when the pieces have names that mean something on their own.

## Interview angle

- *"What is a higher-order function?"* One that takes a function as an argument or returns one — `map`, `filter`, `compose`, `debounce`.
- *"Currying versus partial application?"* Currying: one argument at a time, returning functions until all are supplied. Partial: fix some arguments now, take the rest later.
- *"Implement `compose`/`pipe`."* `reduceRight`/`reduce` over the functions, starting from the input value.
- *"Why does `[\"1\",\"2\"].map(parseInt)` misbehave?"* `map` passes `(element, index)`; `parseInt` reads the index as the radix.
- *"What is the error-first callback convention?"* Callback last; first parameter an error or `null`; check it and return before using the result.

## Key takeaways

- Functions in, functions out: `map`/`filter`/`reduce` for data; factories (`greaterThan(n)`) for behaviour.
- `pipe` (left to right) and `compose` (right to left) chain unary functions; name the steps.
- Curry for one-at-a-time specialisation, partial for fixing leading arguments, `once`/`debounce`/`throttle` for call control — all closures.
- Error-first callbacks: last argument, `(err, result)`, check `err` first, call exactly once and asynchronously.
- `.map(parseInt)` and passing unbound methods are the two classic traps.
