---
title: Maps — HashMap internals, TreeMap, LinkedHashMap and the modern API
minutes: 16
---
`Map<K, V>` is the most used data structure after `List`, and `HashMap` is the one every interviewer asks about: how it stores entries, what happens on collision, why it resizes, why `hashCode` matters. This lesson covers that machinery, the three main implementations, and the Java 8 methods — `getOrDefault`, `merge`, `computeIfAbsent`, `putIfAbsent` — that replaced most of the null-checking boilerplate maps used to require.

## `HashMap` internals

A `HashMap` is an array of **buckets** (`Node<K,V>[] table`, length a power of two, default 16). To `put(key, value)`:

1. Compute `h = key.hashCode()`, spread its high bits into the low bits (`h ^ (h >>> 16)`), and take the bucket index `h & (table.length - 1)`.
2. If the bucket is empty, store a new node there.
3. Otherwise walk the bucket's chain comparing `hash` first and then `equals`; replace the value if the key is found, else append a node.
4. If `size` exceeds `capacity × loadFactor` (0.75 by default), **resize**: double the table and redistribute every node.

`get(key)` is the same hash-and-walk, without the insert. With well-distributed hash codes each bucket holds about one node and both are O(1). When many keys share a bucket (bad `hashCode`, or a deliberate collision attack), a chain longer than 8 is converted into a red-black **tree** (Java 8+), bounding the worst case at O(log n) — provided the keys are `Comparable`.

Consequences you must know:

- **`hashCode` and `equals` must agree** (Module 8), or `get` looks in the wrong bucket.
- **Keys must not change** while in the map — the bucket was chosen from the old hash.
- **Iteration order is unspecified** and changes after a resize. Never rely on it.
- **Initial capacity** (`new HashMap<>(expectedSize / 0.75 + 1)`) avoids resizes when the count is known; the default is fine otherwise.
- One `null` key is allowed (bucket 0); null values are allowed — which is why `get` returning null is ambiguous (`containsKey` disambiguates).

## The three implementations

| | `HashMap` | `LinkedHashMap` | `TreeMap` |
| --- | --- | --- | --- |
| get/put/remove | O(1) avg | O(1) avg | O(log n) |
| Order | none | insertion (or access, with a flag) | sorted by key |
| Null keys | one | one | none |
| Needs | `equals`/`hashCode` on keys | same | `Comparable` keys or a `Comparator` |
| Extra | — | `removeEldestEntry` → LRU cache | `firstKey`, `floorKey`, `headMap`, `subMap`, `descendingMap` |

`LinkedHashMap` threads a doubly linked list through the entries; with `accessOrder = true` every `get` moves the entry to the end, and overriding `removeEldestEntry` gives a bounded LRU cache in five lines (Module 13's exercise). `TreeMap` is a red-black tree keyed by `compareTo` — the navigation methods are its reason to exist.

## The modern API

```java
Map<String, Integer> counts = new HashMap<>();

// counting — the old way, with a null check
Integer c = counts.get(word);
counts.put(word, c == null ? 1 : c + 1);

// counting — the modern way
counts.merge(word, 1, Integer::sum);                     // put 1 if absent, else combine old and 1

// reading with a default
int n = counts.getOrDefault(word, 0);                    // no null, no unboxing NPE

// multimap: a list per key, created on first use
Map<String, List<String>> byInitial = new HashMap<>();
byInitial.computeIfAbsent(word.substring(0, 1), k -> new ArrayList<>()).add(word);

// insert only if absent
counts.putIfAbsent("x", 0);                              // returns the existing value or null

// recompute in place
counts.compute("x", (k, v) -> v == null ? 1 : v * 2);
counts.computeIfPresent("x", (k, v) -> v > 100 ? null : v);   // returning null REMOVES the entry

// bulk
counts.forEach((k, v) -> System.out.println(k + "=" + v));
counts.replaceAll((k, v) -> v * 10);
counts.entrySet().removeIf(e -> e.getValue() == 0);
```

`merge(key, value, fn)`: if absent, store `value`; else store `fn(old, value)`; a `null` result removes the key. `computeIfAbsent(key, fn)`: if absent (or mapped to null), store and return `fn(key)`; else return the existing value — and the mapping function must not modify the map. These two replace the majority of `if (map.containsKey(...))` code.

## Iterating

```java
for (Map.Entry<String, Integer> e : counts.entrySet()) {     // the efficient way: one lookup per entry
    e.getKey(); e.getValue(); e.setValue(e.getValue() + 1);    // setValue writes through
}
for (String k : counts.keySet()) counts.get(k);              // two lookups per entry — avoid
for (int v : counts.values()) …
counts.forEach((k, v) -> …);
```

`keySet()`, `values()` and `entrySet()` are **views**: removing from them removes from the map (`counts.keySet().removeIf(...)`, `counts.values().remove(0)` removes one entry with value 0), and adding to them is unsupported. Modifying the map while iterating a view throws `ConcurrentModificationException` — except through the iterator's own `remove` or `entry.setValue`.

## `TreeMap` navigation

```java
TreeMap<Integer, String> t = new TreeMap<>();
t.firstKey(); t.lastKey(); t.firstEntry();
t.floorKey(25); t.ceilingKey(25); t.lowerKey(20); t.higherKey(20);
t.headMap(30); t.tailMap(30, true); t.subMap(10, 30);       // views
t.pollFirstEntry(); t.descendingMap();
```

Same navigation as `TreeSet`, with entries. Interval lookups, "the price valid at date d" (`floorEntry(d)`), leaderboards and ordered reports are `TreeMap` jobs.

## Choosing a key type

Keys must be immutable with correct `equals`/`hashCode` (hash maps) or a consistent `compareTo` (tree maps): `String`, `Integer`, `Long`, enums, records, `UUID`, `LocalDate`. Composite keys are records (`record Cell(int r, int c)`). Never arrays (identity equality), never mutable objects.

## `Map.of`, `Map.entry`, copies

`Map.of("a", 1, "b", 2)` (up to 10 pairs) and `Map.ofEntries(Map.entry("a", 1), …)` are immutable, null-hostile, order-randomised. `Map.copyOf` copies; `Collections.unmodifiableMap` wraps. `new HashMap<>(other)` copies into a mutable map.

## Interview angle

- *"How does `HashMap` work?"* Hash → bucket index; chain (then tree) of nodes; `equals` to confirm; resize at 0.75 load; O(1) average.
- *"What happens with a bad `hashCode`?"* Everything lands in one bucket: O(n) lookups, or O(log n) once treeified.
- *"Why is 0.75 the load factor?"* A time/space compromise: fewer collisions than 1.0, less waste than 0.5.
- *"`HashMap` vs `Hashtable` vs `ConcurrentHashMap`?"* Unsynchronised / legacy fully synchronised / modern concurrent with striped locking (Module 17).
- *"How do you count words?"* `merge(word, 1, Integer::sum)`.
- *"Can a `HashMap` have a null key?"* One. `TreeMap` and `ConcurrentHashMap` cannot.

## Key takeaways

- `HashMap`: buckets by spread `hashCode`, chains that treeify, resize at 0.75 — O(1) with good hashes; immutable keys with consistent `equals`/`hashCode`.
- `LinkedHashMap` for order and LRU; `TreeMap` for sorted keys and `floorKey`-style navigation; none of the three is thread-safe.
- `getOrDefault`, `merge`, `computeIfAbsent`, `putIfAbsent`, `compute` replace null-check boilerplate; a null result from `compute*`/`merge` removes.
- Iterate `entrySet()`; the views write through and are fail-fast.
