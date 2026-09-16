---
title: The array methods toolbox — map, filter, reduce and friends
minutes: 14
---
Most array code in modern JavaScript is a chain of methods: `filter` to keep, `map` to transform, `reduce` to summarise, `find` to locate, `some`/`every` to test, `flatMap` to expand. Each takes a callback, runs the loop for you, and returns something new — which makes pipelines readable and, because they never mutate the source, safe. This lesson is the toolbox with the shape of each method, the `reduce` patterns that replace half the loops you would otherwise write, when to chain and when a plain loop is better, and the mistakes that recur.

## The callback signature

Every iteration method calls its callback with `(element, index, array)`; `reduce` prepends the accumulator. Use only what you need — `arr.map((x) => x * 2)` — and never pass a function that has optional extra parameters (`.map(parseInt)` reads the index as a radix). A `thisArg` can be passed as a second argument; arrows make it obsolete.

## Transform and keep

```js
nums.map((x) => x * 2)                       // same length, each element transformed
nums.filter((x) => x % 2 === 0)              // those passing the test
nums.filter(Boolean)                         // drop falsy values
users.map((u) => u.email)                    // pluck a field
users.filter((u) => u.active).map((u) => u.name)   // chain: filter first, map less
nested.flat(); nested.flat(2);               // [[1,[2]],[3]] → flat() [1,[2],3]; flat(2) [1,2,3]
words.flatMap((w) => w.split(""))            // map then flatten one level — one-to-many
[1, 2, 3].flatMap((x) => (x % 2 ? [x, x] : []))   // duplicate odds, drop evens: filter+map in one pass
```

`flatMap` returning `[]` for "drop" and `[a, b]` for "expand" is the idiom for a filter-and-map with variable output count.

## Search and test

```js
users.find((u) => u.id === id)               // the element or undefined
users.findIndex((u) => u.id === id)          // index or -1
users.some((u) => u.admin)                   // any?
users.every((u) => u.verified)               // all? (true for an empty array — vacuous truth)
users.includes(x)                            // === membership (finds NaN)
```

`find` returns the element itself, so `find(...)?.name` is the safe follow-up. `some` and `every` short-circuit.

## `reduce`: one fold, many patterns

```js
nums.reduce((sum, x) => sum + x, 0)                          // sum; ALWAYS pass the initial value
nums.reduce((best, x) => (x > best ? x : best), -Infinity)   // max (Math.max(...nums) is simpler for small arrays)
words.reduce((counts, w) => { counts[w] = (counts[w] ?? 0) + 1; return counts; }, {})   // frequency map
users.reduce((byId, u) => { byId[u.id] = u; return byId; }, {})                          // index by key
users.reduce((groups, u) => { (groups[u.city] ??= []).push(u); return groups; }, {})    // group by
pairs.reduce((m, [k, v]) => m.set(k, v), new Map())                                       // build a Map (set returns the map)
fns.reduce((acc, f) => f(acc), x)                                                         // pipe
```

Without an initial value `reduce` uses the first element as the seed and **throws on an empty array** — pass the seed. The accumulator may be mutated when you created it (`{}`/`[]` seeds), which is faster than spreading a new object every iteration; the `{ ...acc, [k]: v }` style is O(n²) on large inputs. When a `reduce` grows past four or five lines, a `for…of` loop with the same variables is clearer — `reduce` is for folds that read as one idea.

## Iterate for effect

```js
items.forEach((item, i) => console.log(i, item));   // no return value; cannot break
for (const item of items) { if (done(item)) break; }  // use a loop when you need break/continue/await
for (const [i, item] of items.entries()) { }          // index + element
```

`forEach` is for side effects; `map` is for producing a new array — a `map` whose result is ignored, or a `forEach` that pushes into an outside array, is the wrong method. Neither `forEach` nor `map` waits for `await` inside the callback (module 8); use `for…of`.

## Sorting and ordering in pipelines

```js
[...users].sort((a, b) => a.age - b.age)            // copy then sort — sort mutates
users.slice().sort(...)                              // same
scores.reduce((a, b) => Math.max(a, b), -Infinity)   // max without spreading a huge array
```

Chains that end in `.sort` without a copy sort the previous step's fresh array — fine — but `original.sort` is not.

## Chaining, and its cost

```js
const total = orders
  .filter((o) => o.paid)
  .flatMap((o) => o.lines)
  .map((l) => l.qty * l.price)
  .reduce((a, b) => a + b, 0);
```

Each step allocates an intermediate array; on ten thousand items it is negligible, on ten million it is not, and a single loop is faster. For readability chains win almost always; for the hot path, measure. Iterator helpers (`.values().map(...).filter(...)`, lazy, Node 22+) will remove the trade-off; on Node 16 they do not exist.

## Removing duplicates, uniqueness by key

```js
[...new Set(nums)]                                                   // primitives
const seen = new Set(); users.filter((u) => !seen.has(u.id) && seen.add(u.id));   // by key (add returns the Set → truthy)
Object.values(users.reduce((m, u) => ({ ...m, [u.id]: u }), {}))     // last wins
```

## Common mistakes

- `.map(parseInt)` → `.map(Number)` or `.map((s) => parseInt(s, 10))`.
- `reduce` without a seed on a possibly-empty array.
- Mutating inside `map`/`filter` callbacks (pushing to an outer array, changing the element).
- `forEach` with `async` callbacks expecting sequential `await`.
- `arr.sort()` for numbers; `original.sort()` when a copy was wanted.
- `filter` then `[0]` instead of `find`; `filter(...).length > 0` instead of `some`.
- Comparing objects with `includes`/`indexOf` (identity) when you meant "by id".

## Interview angle

- *"`map` versus `forEach`?"* `map` returns a new array of results; `forEach` returns nothing and is for side effects.
- *"Implement `groupBy` with `reduce`."* Seed `{}`, `(groups[key(x)] ??= []).push(x)`, return `groups`.
- *"Why pass an initial value to `reduce`?"* Empty arrays throw without one, and the accumulator type is explicit.
- *"`find` versus `filter`?"* First match (or `undefined`) versus all matches (an array, possibly empty).
- *"`flatMap`?"* Map to arrays then flatten one level — filter-and-map in one pass.

## Key takeaways

- `filter` keeps, `map` transforms, `flatMap` expands or drops, `find`/`some`/`every` search and test.
- `reduce` with a seed: sums, max, frequency map, group by, index by key, pipe; mutate a `{}`/`[]` seed for speed.
- `forEach` for effects, `for…of` when you need `break` or `await`.
- Copy before `sort`; never `.map(parseInt)`; `[...new Set(a)]` to dedupe.
- Chains for clarity, a loop for the hot path.
