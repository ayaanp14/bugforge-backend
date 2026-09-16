---
title: The seven primitives, objects and typeof
minutes: 12
---
JavaScript has exactly eight kinds of value: seven **primitives** — `undefined`, `null`, `boolean`, `number`, `bigint`, `string`, `symbol` — and **object**, which covers everything else: plain objects, arrays, functions, dates, regexes, maps. Every surprise about "types" in this language comes from three facts: variables have no type (only values do), primitives are copied by value while objects are shared by reference, and the `typeof` operator has two historical quirks. This lesson lays the type system out plainly so the coercion rules in the following lessons have something to stand on.

## Primitives are values; objects are references

```js
let a = "hi";  let b = a;  b += "!";       // a is still "hi": strings are copied
let o = { n: 1 }; let p = o; p.n = 2;      // o.n is 2: both names point at one object
```

A primitive is **immutable** — you never change a string or a number, you make a new one — and comparing two primitives with `===` compares their contents. An object is a **mutable thing with an identity**; two object variables are `===` only if they refer to the same object, and `{} === {}` is `false`. This single distinction explains function-argument behaviour (module 3), copying (module 4) and why `const o = {}` still lets you change `o.n`.

## `typeof`, and its two lies

```js
typeof undefined   // "undefined"
typeof true        // "boolean"
typeof 42          // "number"
typeof 42n         // "bigint"
typeof "s"         // "string"
typeof Symbol()    // "symbol"
typeof {}          // "object"
typeof []          // "object"     ← arrays are objects; use Array.isArray
typeof null        // "object"     ← a bug from 1995, kept for compatibility
typeof (() => 1)   // "function"   ← functions are objects, but typeof singles them out
typeof notDeclared // "undefined"  ← the one operator that does not throw on an undeclared name
```

Remember the two exceptions: **`typeof null` is `"object"`** (test null with `=== null`), and **arrays report `"object"`** (test with `Array.isArray(x)`). `typeof` on an undeclared identifier returns `"undefined"` instead of throwing, which is why feature-detection code writes `typeof window !== "undefined"`.

## `undefined` versus `null`

Both mean "no value", and the language uses them differently. **`undefined`** is what the engine produces: an uninitialised variable, a missing property, a missing argument, a function with no `return`, an out-of-range array index. **`null`** is what *you* write to say "deliberately empty": a search that found nothing, an optional field that is absent. `undefined == null` is `true` (the one useful `==`), `undefined === null` is `false`. The **nullish** operators treat them alike: `x ?? d` supplies `d` for either; `a?.b` short-circuits on either. Style rule: return `null` for "no result" from your own functions; check for both with `== null` or `??`.

## `number` and `bigint`

There is one `number` type — a 64-bit IEEE-754 double — for integers and fractions alike: `1` and `1.0` are the same value, `0.1 + 0.2 !== 0.3`, and integers are exact only up to `Number.MAX_SAFE_INTEGER` (2⁵³ − 1 ≈ 9 × 10¹⁵). `bigint` (2020) is arbitrary precision for whole numbers: `123n`, `BigInt("9007199254740993")`; it never mixes implicitly with `number` (`1n + 1` is a `TypeError`), has no fractions, and cannot be used with `Math`. Both get a full lesson next.

## `string`

Immutable sequences of UTF-16 code units, in single, double or backtick quotes. Backticks make **template literals**: `` `total: ${a + b}` `` interpolates any expression and may span lines. There is no separate character type — `"a"` is a string of length 1 — and `s[0]` or `s.at(-1)` read units, not necessarily whole characters (module on strings).

## `symbol`

A guaranteed-unique value created by `Symbol("description")`, used as a property key that cannot collide with any string key. You will mostly meet the **well-known symbols** the language defines — `Symbol.iterator` (what `for…of` looks for, module 6), `Symbol.asyncIterator`, `Symbol.toPrimitive` — rather than create your own.

## Wrapper objects and autoboxing

`"abc".toUpperCase()` works although `"abc"` is a primitive because the engine temporarily wraps it in a `String` object to look up the method, then discards the wrapper. You never need `new String("x")` or `new Number(1)` — they create *objects*, so `new Number(1) === 1` is `false` and `typeof new String("x")` is `"object"`. Use `String(x)`, `Number(x)`, `Boolean(x)` **without `new`** as conversion functions; never the constructors.

## Checking types in practice

| Question | Write |
| --- | --- |
| is it a string / number / boolean? | `typeof x === "string"` … |
| is it an array? | `Array.isArray(x)` |
| is it `null` or `undefined`? | `x == null` (or `x === null`, `x === undefined` separately) |
| is it a function? | `typeof x === "function"` |
| is it a plain object? | `typeof x === "object" && x !== null && !Array.isArray(x)` |
| is it a specific class instance? | `x instanceof Date` |
| is it a usable number? | `typeof x === "number" && Number.isFinite(x)` — `NaN` is a number too |

## Interview angle

- *"What are JavaScript's data types?"* Seven primitives — undefined, null, boolean, number, bigint, string, symbol — plus object.
- *"What is `typeof null`?"* `"object"` — a historical bug; check with `=== null`.
- *"`undefined` versus `null`?"* Engine-produced absence versus deliberate emptiness; `==` treats them equal, `===` does not; `??` and `?.` handle both.
- *"Primitive versus object?"* Immutable, compared and copied by value versus mutable, compared and shared by identity.
- *"How do you tell an array from an object?"* `Array.isArray` — `typeof` says `"object"` for both.

## Key takeaways

- Seven primitives + object; values have types, variables do not.
- Primitives: immutable, by value. Objects: mutable, by reference; `{} !== {}`.
- `typeof null === "object"` and `typeof [] === "object"` are the two traps; `Array.isArray`, `=== null`.
- `undefined` is the engine's absence, `null` is yours; `??` and `?.` treat them alike.
- Conversion functions `String(x)`/`Number(x)`/`Boolean(x)` — never the constructors with `new`.
