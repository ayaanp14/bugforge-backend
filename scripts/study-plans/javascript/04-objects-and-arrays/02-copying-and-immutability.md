---
title: References, shallow and deep copies, and freezing
minutes: 13
---
Objects are shared by reference, so "copying" an object is a decision, not an operation: copy the reference (an alias), copy one level of properties (shallow), or copy everything reachable (deep). Getting it wrong is the source of bugs that look supernatural — a change in one place appears in another, a default config mutated by its first user, a React state update that did not re-render. This lesson lays out the three levels, the tools for each (`{...obj}`, `Object.assign`, `structuredClone`, the JSON trick), `Object.freeze` and what it does not do, and the immutable-update idioms that modern code prefers.

## Level 0: aliasing

```js
const a = { n: 1, tags: ["x"] };
const b = a;              // same object, two names
b.n = 2;                  // a.n is 2
```

Assignment, passing as an argument, storing in an array — all copy the **reference**. Function parameters are the classic trap: a function that mutates its argument mutates the caller's object.

## Level 1: shallow copy

```js
const c = { ...a };                 // spread: own enumerable props, one level
const d = Object.assign({}, a);     // same result, older syntax
c.n = 3;                            // a.n unchanged
c.tags.push("y");                   // a.tags is ["x", "y"] — the array was shared, not copied
```

Spread copies the *properties*; any property that is itself an object is still the same nested object. Shallow copies are exactly right when the nested objects are treated as immutable (the common case in well-designed code) and exactly wrong when you then mutate a nested value. Arrays: `[...arr]`, `arr.slice()`, `Array.from(arr)` — all shallow.

## Level 2: deep copy

```js
const e = structuredClone(a);            // Node 17+ / modern browsers: deep, handles Dates, Maps, Sets, cycles; not functions
const f = JSON.parse(JSON.stringify(a)); // the old trick: deep, but drops undefined/functions, turns Dates into strings, throws on cycles and BigInt
function deepClone(v) {                  // by hand, for plain data (objects, arrays, primitives)
  if (Array.isArray(v)) return v.map(deepClone);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepClone(x)]));
  return v;
}
```

`structuredClone` is the right answer where it exists (Node 17+; this plan's Node 16 lacks it — write the recursive version or use the JSON trick for plain data). Deep copies cost time proportional to the whole graph; if you find yourself deep-cloning on every update, the design wants immutable updates instead.

## `Object.freeze` — shallow, but honest

```js
const cfg = Object.freeze({ retries: 3, hosts: ["a"] });
cfg.retries = 5;          // ignored silently in sloppy mode, TypeError in strict mode
cfg.hosts.push("b");      // works! freeze is shallow — the array is a separate, unfrozen object
Object.isFrozen(cfg);     // true
```

Freezing forbids adding, removing and changing own properties of *that* object. For a deep freeze, recurse (`Object.freeze` each nested object); libraries do this for constants. `Object.seal` (no add/remove, but changes allowed) and `Object.preventExtensions` (no add) are its lighter siblings, rarely used. `const` freezes nothing — it only stops rebinding the variable.

## Immutable updates: the idiom modern code prefers

Instead of mutating an object, produce a new one with the change:

```js
const user = { name: "Ada", address: { city: "London", zip: "N1" }, tags: ["a"] };

const renamed = { ...user, name: "Ada L." };                                  // change a top-level field
const moved = { ...user, address: { ...user.address, city: "Paris" } };       // change a nested field: spread each level you touch
const tagged = { ...user, tags: [...user.tags, "b"] };                        // append to a nested array
const { tags, ...withoutTags } = user;                                        // remove a field (rest destructuring)
const list2 = list.map((u) => (u.id === id ? { ...u, active: true } : u));   // update one element of an array
const list3 = list.filter((u) => u.id !== id);                                // remove one
```

Each result shares the untouched parts with the original — cheap — and equality of references now means "nothing changed", which is what React, Redux and every memoisation scheme rely on. The rules: spread every level on the path to the change; never call a mutating array method (`push`, `sort`, `splice`) on shared data; treat function arguments as read-only unless the function's name says otherwise (`sortInPlace`).

## Mutating versus non-mutating array methods

| Mutate the array | Return a new array |
| --- | --- |
| `push`, `pop`, `shift`, `unshift` | `concat`, `slice`, `[...a]` |
| `splice` | `filter`, `map`, `flat`, `flatMap` |
| `sort`, `reverse` | `toSorted`, `toReversed` (Node 20+); `[...a].sort()` on 16 |
| `fill`, `copyWithin` | `Array.from`, `with` (Node 20+) |

`sort` mutating in place is the one that bites: `const sorted = arr.sort()` sorts `arr` *and* aliases it. Copy first: `[...arr].sort(cmp)`.

## Equality of objects

`===` on objects is identity. There is no built-in structural equality; write one (compare `Object.entries` recursively), use `JSON.stringify` for plain data with stable key order, or a library's `isEqual`. Two separately created objects with the same content are never `===`, which is the whole reason immutable updates make change detection cheap: a *changed* object is a *different* reference.

## Defensive copying at boundaries

A class that stores an array it was given, or returns its internal array, hands out aliases: callers can mutate its state from outside. Copy on the way in (`this.items = [...items]`) and on the way out (`return [...this.items]` or a frozen view). The same applies to default parameter objects — `function f(opts = DEFAULTS)` shares one `DEFAULTS` between all calls; spread it.

## Interview angle

- *"Shallow versus deep copy?"* Shallow copies one level (`{...o}`, `Object.assign`); nested objects are shared. Deep copies the whole graph (`structuredClone`, recursion).
- *"What does `Object.freeze` do?"* Prevents adding/removing/changing the object's own properties — shallowly; nested objects stay mutable.
- *"Does `const` make an object immutable?"* No — only the binding.
- *"How do you update a nested field immutably?"* Spread every level on the path: `{ ...u, address: { ...u.address, city } }`.
- *"Why does `arr.sort()` cause bugs?"* It sorts in place and returns the same array; copy first.

## Key takeaways

- Assignment aliases; spread/`assign`/`slice` copy one level; `structuredClone` or recursion copies deeply.
- `Object.freeze` is shallow; `const` is not immutability at all.
- Prefer immutable updates — spread the path, `map`/`filter` arrays — so a changed thing is a new reference.
- Know which array methods mutate (`push`, `sort`, `splice`, `reverse`) and copy before them on shared data.
- Copy at class and function boundaries; never share a default options object.
