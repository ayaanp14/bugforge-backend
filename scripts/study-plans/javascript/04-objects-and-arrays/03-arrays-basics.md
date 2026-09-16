---
title: Arrays — dynamic, sparse, and sorted lexically by default
minutes: 13
---
A JavaScript array is an object with integer-like keys, a `length` that follows the largest index, and a prototype full of methods. It grows on demand, may have holes, holds anything, and sorts its elements as **strings** unless told otherwise — the last fact alone has produced a million wrong leaderboards. This lesson covers construction, indexing, `length`, the mutating core (`push`/`pop`/`shift`/`unshift`/`splice`), slicing and searching, `sort` with a comparator, and the conversions from and to other shapes.

## Making arrays

```js
const a = [1, 2, 3];                       // literal — the normal way
const b = new Array(3);                    // [ <3 empty items> ] — length 3, NO elements (holes)
const c = Array.of(3);                     // [3]
const d = Array.from({ length: 3 }, (_, i) => i * i);   // [0, 1, 4] — length + mapping function
const e = Array.from("abc");               // ["a", "b", "c"] — any iterable
const f = [...someSet];                    // spread an iterable
const g = Array(5).fill(0);                // [0, 0, 0, 0, 0]
```

`new Array(n)` with one numeric argument is the trap: it creates holes, not zeros, and `map` skips holes. `Array.from({ length: n }, fn)` or `Array(n).fill(x)` are the idioms for "n of something". `Array(n).fill([])` fills with the **same** array `n` times — use `Array.from({ length: n }, () => [])` for independent ones.

## Indexing and `length`

```js
a[0]; a[a.length - 1]; a.at(-1);           // at() accepts negatives (2022)
a[10] = 1;                                  // extends length to 11, leaving holes 3..9
a.length = 2;                               // truncates: [1, 2]
a[-1]                                       // undefined — a property named "-1", not the last element
```

`length` is the highest index + 1, not a count of defined elements; assigning to it truncates or extends. Out-of-range reads give `undefined`, never an error. Holes (`[1, , 3]`, `new Array(n)`) are rare in practice and skipped by `forEach`/`map`/`filter` but visited by `for…of` (as `undefined`) — avoid creating them.

## The mutating core

```js
a.push(4, 5);       // append, returns new length      — O(1)
a.pop();            // remove last, returns it         — O(1)
a.unshift(0);       // prepend, returns new length     — O(n): every element shifts
a.shift();          // remove first, returns it        — O(n)
a.splice(1, 2);             // remove 2 elements at index 1, returns them
a.splice(1, 0, "x", "y");   // insert at 1 without removing
a.splice(1, 1, "z");        // replace one
```

Stack = `push`/`pop`; queue = `push`/`shift` (fine for small queues; for large ones the O(n) `shift` matters — use an index or a deque). `splice` is the Swiss-army knife for in-place edits; its return value is the removed elements.

## Non-mutating slices and joins

```js
a.slice(1, 3);        // copy of [1, 3) — end exclusive; negatives from the end; slice() copies all
a.concat([9], 10);    // new array; spread [...a, 9, 10] is the modern spelling
a.join("-");          // "1-2-3"; join() defaults to ","; String(a) is the same
a.indexOf(2); a.lastIndexOf(2); a.includes(2);   // includes finds NaN; indexOf does not
a.flat(); a.flat(Infinity);                       // flatten one level / completely
```

## `sort` — the trap and the fix

```js
[10, 9, 1, 100].sort();                   // [1, 10, 100, 9] — converted to strings and compared lexically!
[10, 9, 1, 100].sort((x, y) => x - y);    // [1, 9, 10, 100] — numeric ascending
words.sort((x, y) => x.localeCompare(y)); // human order for strings
people.sort((p, q) => p.age - q.age || p.name.localeCompare(q.name));   // by age, then name
```

The comparator returns negative/zero/positive; `x - y` is fine for safe integers, and `(x > y) - (x < y)` or `Math.sign` when overflow or non-numbers are possible. `sort` is **stable** (since ES2019) and **in place** — copy first (`[...a].sort(cmp)`) when the original must survive. `reverse` is also in place. Node 20+ has `toSorted`/`toReversed` that return copies; Node 16 does not.

## Searching with predicates

```js
a.find((x) => x > 1);        // first match or undefined
a.findIndex((x) => x > 1);   // or -1
a.some((x) => x > 1); a.every((x) => x > 0);
a.findLast(...)              // Node 18+ — not available here; use a reverse loop
```

## Multidimensional arrays

```js
const grid = Array.from({ length: rows }, () => Array(cols).fill(0));   // independent rows
grid[r][c] = 1;
const transposed = grid[0].map((_, c) => grid.map((row) => row[c]));
```

There is no 2-D array type — an array of arrays — and the "same inner array n times" mistake from `Array(n).fill(Array(m))` is the one to remember.

## Conversions

`Array.from(iterableOrArrayLike)`, `[...iterable]`, `Object.entries(obj)`, `Object.fromEntries(pairs)`, `Array.isArray(x)`, `arr.join`, `str.split`, `new Set(arr)` (dedupe) then `[...set]`, `Array.from(map.values())`. Array-like objects (`arguments`, DOM `NodeList`) are not arrays until `Array.from` makes them one.

## Performance notes

Engines store dense arrays of small integers or of doubles very efficiently; mixing types, creating holes, or using `delete arr[i]` (which makes a hole — use `splice`) degrades them to dictionary mode. Typed arrays (`Int32Array`, `Float64Array`) give fixed-type numeric storage for heavy numeric work. For interview scale none of this matters; the habits — dense, homogeneous, no `delete` — are free.

## Interview angle

- *"Why does `[10, 9, 1].sort()` give `[1, 10, 9]`?"* Default sort compares as strings; pass a numeric comparator.
- *"`push`/`pop` versus `shift`/`unshift` cost?"* O(1) at the end; O(n) at the front because elements shift.
- *"`slice` versus `splice`?"* `slice` copies a range and does not mutate; `splice` removes/inserts in place and returns the removed items.
- *"How do you make an n×m grid of zeros?"* `Array.from({ length: n }, () => Array(m).fill(0))` — not `fill(Array(m))`, which shares one row.
- *"How do you dedupe an array?"* `[...new Set(arr)]`.

## Key takeaways

- Literals to create; `Array.from({ length }, fn)` or `Array(n).fill(x)` for n items; never `new Array(n)` alone.
- `length` tracks the highest index; `at(-1)` for the end; out-of-range reads are `undefined`.
- `push`/`pop` O(1), `shift`/`unshift` O(n), `splice` for in-place edits; `slice`/spread/`concat` copy.
- `sort` compares as strings by default and mutates — `(x, y) => x - y`, copy first when needed.
- Grids are arrays of independent arrays; dedupe with `Set`; `includes` finds `NaN`, `indexOf` does not.
