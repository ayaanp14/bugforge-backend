---
title: Checkpoint — Objects, arrays and destructuring
minutes: 24
seo-title: JavaScript Objects and Arrays Quiz: reduce and sort Practice
description: Test your JavaScript objects and arrays with 12 questions and three programs on JSON, shallow vs deep copy, sort, map, filter, reduce and destructuring.
q: Why is new Array(3) not the same as [0, 0, 0]?
a: `new Array(3)` creates an array of length 3 with three holes and no elements, which `map` and `forEach` skip. `Array(3).fill(0)` or `Array.from({ length: 3 }, () => 0)` gives three real zeros.
q: What does [10, 9, 1].sort() return in JavaScript?
a: It returns `[1, 10, 9]`, because the default sort compares elements as strings. Pass a numeric comparator, `(x, y) => x - y`, to get `[1, 9, 10]`, and remember that `sort` also reorders the original array.
q: What does JSON.parse not bring back?
a: `JSON.parse` returns plain objects and arrays, so whatever `JSON.stringify` dropped or converted stays lost: methods, `undefined` values, symbols, and `Date` objects, which come back as ISO strings rather than `Date`s.
---
This checkpoint covers object literals and their shorthands, property access and testing, key iteration order and JSON, references versus shallow and deep copies with `Object.freeze` and immutable updates, arrays — construction, `length`, the mutating core, `sort` with a comparator — the method toolbox with `reduce` patterns, and destructuring and spread in all their forms.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- When bracket access is required, and what `Object.hasOwn` adds over `in`.
- What `JSON.stringify` drops and what `JSON.parse` cannot bring back.
- Shallow versus deep copy; what `Object.freeze` does not freeze; how to update a nested field immutably.
- Why `new Array(3)` is not `[0, 0, 0]`, and what `[10, 9, 1].sort()` returns.
- `map` versus `forEach`, `find` versus `filter`, and why `reduce` needs a seed.
- Object versus array destructuring, defaults on `undefined`, and which spread wins on duplicate keys.

The programs are a grouping-and-summary report built from `reduce` and `Object.entries`, an immutable-update engine that applies dotted-path changes to a JSON document without mutating the original, and a records processor using destructuring in every parameter list.
