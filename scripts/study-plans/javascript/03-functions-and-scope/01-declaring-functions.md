---
title: Declaring functions — declarations, expressions, arrows and parameters
minutes: 13
---
Functions are the unit of everything in JavaScript: the module, the class method, the callback, the component. The language gives you three ways to write one — a declaration, an expression, an arrow — and they differ in hoisting, in `this` (next lessons) and in how they read. Parameters have their own conveniences: defaults, rest, spread at the call site, destructuring. This lesson is the syntax and semantics of defining and calling functions, with the first-class nature of functions — values you can pass and return — as the thread running through it.

## Three forms

```js
function add(a, b) { return a + b; }                 // declaration: hoisted with its body
const sub = function (a, b) { return a - b; };       // expression: a value assigned to a const
const mul = (a, b) => a * b;                         // arrow: concise, expression body
const div = (a, b) => { const r = a / b; return r; } // arrow with a block body: explicit return
```

A **declaration** is hoisted *with its body*: you may call `add` above the line that defines it. An **expression** and an **arrow** are values; the `const` holding them is in the temporal dead zone until its line runs, so call them only afterwards. Arrows differ from the other two in three ways that later lessons need: no own `this`, no `arguments` object, and they cannot be constructors. Style: declarations for top-level named functions, arrows for callbacks and short helpers, and function expressions rarely (mostly when a callback needs its own `this`).

An arrow returning an **object literal** needs parentheses — `() => ({ ok: true })` — because braces alone start a block body.

## Functions are values

```js
const ops = { add, sub, mul };                 // stored in an object
[1, 2, 3].map((x) => x * 2);                   // passed as an argument
function twice(f) { return (x) => f(f(x)); }   // returned from a function
const inc2 = twice((x) => x + 1);  inc2(5);    // 7
typeof add;                                    // "function"
add.name;                                      // "add" — expressions get the variable's name
add.length;                                    // 2 — declared parameter count (before defaults/rest)
```

A function that takes or returns functions is a **higher-order function** (lesson 5). Because functions are objects they have properties (`name`, `length`) and can carry more if you attach them — rarely wise.

## Parameters

```js
function greet(name = "world", punctuation = "!") { return `Hello, ${name}${punctuation}`; }
greet();               // Hello, world!
greet("Ada");          // Hello, Ada!
greet(undefined, "?"); // Hello, world?   — undefined triggers the default; null does not
```

**Defaults** apply when the argument is `undefined` (missing or explicitly `undefined`), not for `null` or other falsy values, and may reference earlier parameters: `(a, b = a * 2)`. Too few arguments leave the rest `undefined`; too many are ignored (no error). **Rest parameters** collect the remainder into a real array:

```js
function sum(...nums) { return nums.reduce((a, b) => a + b, 0); }
sum(1, 2, 3);                    // 6
function log(level, ...parts) { console.log(level, parts.join(" ")); }
```

Rest must be last. The older `arguments` object (array-like, all arguments, not in arrows) is what rest replaced; do not use it in new code. **Spread** at the call site does the inverse — `sum(...[1, 2, 3])`, `Math.max(...arr)` — and **destructuring** parameters unpack objects and arrays in the signature: `function draw({ x, y, color = "black" }) {}` called as `draw({ x: 1, y: 2 })` — the idiom for "named arguments" (module 4).

## Return

A function with no `return`, or a bare `return;`, returns `undefined`. Only one value comes back; return an array or object for several — `return [min, max]` then `const [lo, hi] = range(xs)`. Early returns (guard clauses) keep the main path unindented. Remember the ASI trap: the value must start on the same line as `return`.

## Calling

`f(a, b)` — positional; `f({ a, b })` — an options object, which reads better past two or three parameters and lets callers omit any; `f?.()` — call only if `f` is not nullish; `f.call(thisValue, a, b)`, `f.apply(thisValue, [a, b])` — explicit `this` (lesson 4); `new F()` — construct (module 5). A missing function is the most common runtime error: `undefined is not a function` means the thing before the parentheses was not what you thought.

## Recursion

A function may call itself; the call stack limits depth to roughly 10 000 frames (`RangeError: Maximum call stack size exceeded`). Node does not do tail-call optimisation, so a deep recursion — walking a long linked list, a naive `sum(n) = n + sum(n - 1)` for large `n` — must be rewritten as a loop or with an explicit stack.

## Immediately invoked function expressions

```js
(function () { const secret = 1; /* … */ })();
(() => { /* … */ })();
```

An **IIFE** creates a scope and runs once — the pre-2015 way to keep variables private in a script. Block scope and modules made it mostly unnecessary; you still see it in bundler output and older code, and occasionally for an async wrapper: `(async () => { await main(); })()`.

## Pure functions and side effects

A **pure** function returns a value determined only by its arguments and changes nothing outside itself. Pure functions are trivially testable, safe to call repeatedly, and what array methods expect. Push side effects (I/O, mutation, `Date.now()`) to the edges and keep the middle pure — the design habit that makes JavaScript codebases tractable.

## Interview angle

- *"Function declaration versus expression?"* Declarations are hoisted with their body; expressions are values assigned at run time (and TDZ-bound if `const`).
- *"What do arrow functions lack?"* Their own `this`, `arguments`, `new`, and a prototype — they are for callbacks and helpers, not methods or constructors.
- *"When does a default parameter apply?"* When the argument is `undefined` — not `null`, not `0`.
- *"Rest versus spread?"* Rest gathers remaining arguments into an array (in a signature); spread expands an iterable into arguments (at a call site).
- *"What is a higher-order function?"* One that takes or returns a function — `map`, `filter`, your own `twice`.

## Key takeaways

- Declarations hoist with their body; expressions and arrows are values available after their line.
- Arrows: expression bodies, `({})` for object returns, no own `this`/`arguments`/`new`.
- Defaults trigger on `undefined`; rest gathers; spread expands; destructured parameters give named arguments.
- One return value — bundle several in an array or object; guard clauses first.
- Functions are values with `name` and `length`; prefer pure functions and keep side effects at the edges.
