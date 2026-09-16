---
title: Map and Set — real keyed collections
minutes: 12
---
For twenty years JavaScript had one collection, the array, and one dictionary, the object — and the object was a poor dictionary: keys became strings, `"constructor"` was already "there", `__proto__` was a security hole, and getting the size meant `Object.keys(o).length`. `Map` and `Set` (2015) are the real thing: any value as a key, insertion order guaranteed, a `size`, O(1) operations, and iteration built in. This lesson is when to use each, the operations, the key-equality rule, the set algebra you have to write yourself on Node 16, and the frequency-count and group-by idioms that make up most of their use.

## Map

```js
const m = new Map();
m.set("a", 1).set("b", 2);               // set returns the map — chainable
m.get("a");          // 1
m.get("zzz");        // undefined
m.has("b");          // true
m.delete("a");       // true if it was there
m.size;              // 1  (a property, not a method — not length, not size())
m.clear();

const fromPairs = new Map([["x", 1], ["y", 2]]);
const fromObject = new Map(Object.entries({ x: 1, y: 2 }));
Object.fromEntries(fromPairs);           // back to an object — only for string keys
```

Keys can be **anything**: objects, functions, `NaN`, `null`. `m.set(someDomNode, data)` attaches data to an object without touching it; `m.set(NaN, 1); m.get(NaN)` works because Map uses **SameValueZero**: `===` except that `NaN` equals `NaN` (and `+0` equals `-0`). Objects are keys by identity — two different `{}` are two keys, and a key you cannot recreate (a fresh literal) can only be found via the reference you kept.

Iteration: `for (const [k, v] of m)`, `m.keys()`, `m.values()`, `m.entries()` (the default), `m.forEach((v, k) => …)` — note value first. Order is **insertion order**, always, for every key type. `[...m]` gives the pairs; `[...m.keys()]` the keys.

## Set

```js
const s = new Set([1, 2, 2, 3]);         // {1, 2, 3}
s.add(4).add(1);                          // add ignores duplicates, returns the set
s.has(2); s.delete(2); s.size;
[...new Set(arr)]                         // the dedupe idiom
const seen = new Set(); items.filter((x) => !seen.has(x.id) && seen.add(x.id));   // dedupe by key
```

Same equality rule (`NaN` is one member), same insertion order, same iteration (`for…of`, `values()`, `forEach`). A Set of objects holds them by identity — `new Set([{}, {}]).size` is 2.

## Set algebra, by hand

Node 22 gained `union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf` and friends; Node 16 has none, so know the one-liners:

```js
const union = new Set([...a, ...b]);
const intersection = new Set([...a].filter((x) => b.has(x)));
const difference = new Set([...a].filter((x) => !b.has(x)));
const symmetric = new Set([...[...a].filter((x) => !b.has(x)), ...[...b].filter((x) => !a.has(x))]);
const isSubset = [...a].every((x) => b.has(x));
```

`b.has` is O(1), so each is O(n); the equivalent with arrays and `includes` is O(n²) and the classic "why is this slow on 50k items" bug.

## Map versus object

| | `Map` | plain object |
| --- | --- | --- |
| Key types | any value | strings and symbols (others coerced) |
| Prototype hazards | none | `constructor`, `toString`, `__proto__` |
| Size | `.size` | `Object.keys(o).length` — O(n) |
| Order | insertion, always | integer-like keys first, then insertion |
| Iteration | direct | via `Object.entries` |
| JSON | not directly (`Object.fromEntries` first) | native |
| Literal syntax | no | yes |
| Hot-path perf | fast for churn (adds/deletes) | fast for fixed shapes (hidden classes) |

Rule of thumb: a **record** with known fields is an object; a **dictionary** keyed by data — especially user data — is a Map. Objects still win where JSON in and out is the whole job.

## The idioms

```js
// frequency count
const counts = new Map();
for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);

// group by
const groups = new Map();
for (const u of users) {
  if (!groups.has(u.city)) groups.set(u.city, []);
  groups.get(u.city).push(u);
}

// sort a map's entries
[...counts].sort(([, a], [, b]) => b - a);      // by value desc
new Map([...m].sort(([a], [b]) => a.localeCompare(b)));   // a sorted copy

// index by id
const byId = new Map(users.map((u) => [u.id, u]));

// cache
const cache = new Map();
function slow(x) { if (!cache.has(x)) cache.set(x, compute(x)); return cache.get(x); }
```

A Map also solves "delete while iterating": deleting the current entry inside `for…of` over a Map is safe (the iterator skips it), where mutating an array during iteration is not.

## Performance and memory

Maps are hash tables: `get`/`set`/`has`/`delete` are O(1) amortised; iteration is O(n) in insertion order. A `Map` with a million entries is fine; a `Map` used for a five-field record is noise. Memory per entry is a few dozen bytes more than an object property. `Set` membership beats `Array.includes` from a few dozen elements up.

## Common mistakes

- `m.size()` (it is a property), `m.length` (undefined), `m[key]` (sets a property on the Map object, not an entry — silently wrong).
- Expecting `m.get({ id: 1 })` to find an entry set with a *different* `{ id: 1 }` object — identity, not structure.
- `JSON.stringify(map)` → `{}`; convert first.
- Using `Object.keys(map)` (empty) instead of `[...map.keys()]`.
- Arrays + `includes` inside a loop where a `Set` was the right structure.

## Interview angle

- *"Map versus object?"* Any key type, no prototype collisions, `size`, insertion order, faster churn — a dictionary; objects for records and JSON.
- *"How does Map compare keys?"* SameValueZero: `===` plus `NaN` equals `NaN`; objects by identity.
- *"Count word frequencies."* `counts.set(w, (counts.get(w) ?? 0) + 1)`.
- *"Intersection of two arrays efficiently?"* Put one in a Set, filter the other with `has` — O(n) instead of O(n²).
- *"Why is `Set` iteration order defined?"* The spec requires insertion order for both Map and Set.

## Key takeaways

- `Map`: any key, `.size`, insertion order, `get/set/has/delete`, iterate entries directly; `Set`: unique values, same rules.
- Keys compare with SameValueZero; objects by identity.
- Set algebra is hand-written on Node 16 — always via `has`, never `includes` in a loop.
- Idioms: frequency count, group by, index by id, cache, dedupe.
- Records are objects; dictionaries keyed by data are Maps; convert for JSON.
