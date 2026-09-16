---
title: Sets — HashSet, LinkedHashSet and TreeSet
minutes: 12
---
A `Set` holds each element at most once, where "once" is decided by `equals` (and `hashCode`, or `compareTo` for tree sets). Three implementations cover almost every need: `HashSet` for speed, `LinkedHashSet` when order of insertion matters, `TreeSet` when elements must be sorted or you need "the smallest element ≥ x". This lesson covers how each decides membership, the set-algebra operations, and the navigation API that makes `TreeSet` worth its logarithm.

## Membership is `equals`/`hashCode` (or `compareTo`)

```java
Set<Point> seen = new HashSet<>();
seen.add(new Point(1, 2));
seen.contains(new Point(1, 2));         // true only if Point overrides equals AND hashCode
```

`HashSet` is a `HashMap` with dummy values: `add` hashes the element to a bucket and compares with `equals` against what is there. A class without a proper `hashCode` puts equal objects in different buckets and the set fills with duplicates. Records and strings are safe; hand-written classes must override both (Module 8).

`TreeSet` never calls `equals` or `hashCode` — it uses `compareTo` (or its `Comparator`): two elements comparing as 0 are the *same* element. `new TreeSet<>(List.of(new BigDecimal("2.0"), new BigDecimal("2.00"))).size()` is 1, while a `HashSet` holds 2.

## The three implementations

| | `HashSet` | `LinkedHashSet` | `TreeSet` |
| --- | --- | --- | --- |
| add/contains/remove | O(1) avg | O(1) avg | O(log n) |
| Iteration order | unspecified, may change on resize | insertion order | sorted |
| Nulls | one allowed | one allowed | not allowed |
| Needs | `equals`/`hashCode` | `equals`/`hashCode` | `Comparable` or a `Comparator` |
| Extra | — | predictable output, LRU-ish with access order via `LinkedHashMap` | `first`, `last`, `floor`, `ceiling`, `headSet`, `subSet`… |

Use `HashSet` by default. Use `LinkedHashSet` when the set is shown to a user or compared in tests — unordered output is a source of flaky tests. Use `TreeSet` when you need sorting or range queries; if you only need the elements sorted *once* at the end, a `HashSet` plus one sort is cheaper.

## Set algebra

```java
Set<String> a = new HashSet<>(List.of("x", "y", "z"));
Set<String> b = Set.of("y", "z", "w");

Set<String> union = new HashSet<>(a); union.addAll(b);           // {x, y, z, w}
Set<String> inter = new HashSet<>(a); inter.retainAll(b);        // {y, z}
Set<String> diff  = new HashSet<>(a); diff.removeAll(b);         // {x}
boolean subset = b.containsAll(inter);                           // true
boolean disjoint = Collections.disjoint(a, Set.of("q"));         // true
```

The bulk operations mutate their receiver, so copy first when the original must survive. Note `add` and `remove` return `boolean` — whether the set changed — which is the idiom for "have I seen this before":

```java
if (!seen.add(item)) System.out.println("duplicate: " + item);
```

## `TreeSet` navigation

```java
TreeSet<Integer> t = new TreeSet<>(List.of(10, 20, 30, 40));
t.first(); t.last();                 // 10, 40
t.floor(25); t.ceiling(25);          // 20, 30   — greatest ≤ / least ≥
t.lower(20); t.higher(20);           // 10, 30   — strictly below / above
t.headSet(30);                       // [10, 20]           — view, exclusive
t.tailSet(30);                       // [30, 40]           — view, inclusive
t.subSet(15, 35);                    // [20, 30]           — view [from, to)
t.pollFirst(); t.pollLast();         // remove and return the ends
t.descendingSet();                   // a reversed view
new TreeSet<>(Comparator.reverseOrder());          // custom order
new TreeSet<>(String.CASE_INSENSITIVE_ORDER);      // "a" and "A" are one element
```

`floor`/`ceiling` in O(log n) are the reason to choose a tree: nearest-neighbour lookups, interval scheduling, "next available slot". The range views are live — modifying them modifies the set, and adding outside the range throws.

## Common patterns

```java
// dedupe preserving first occurrence
List<String> unique = new ArrayList<>(new LinkedHashSet<>(items));

// fast membership for a filter
Set<String> stop = Set.of("the", "a", "an");
words.removeIf(stop::contains);

// count distinct
long distinct = new HashSet<>(items).size();

// first duplicate
Set<Integer> seen = new HashSet<>();
for (int x : nums) if (!seen.add(x)) return x;

// sorted unique output
new TreeSet<>(words)     // iterate in order
```

## Mutating elements — do not

A `HashSet` locates elements by the hash computed at insertion; mutate a field that participates in `hashCode` and the element is in the wrong bucket — `contains` says false, `remove` fails, and the set holds a ghost. Same for `TreeSet` with fields that affect `compareTo`. Set elements (and map keys) should be immutable: strings, numbers, records, enums.

## Immutable sets

`Set.of(...)` (Java 9): immutable, no nulls, no duplicates (throws `IllegalArgumentException` on a duplicate literal), iteration order deliberately randomised per JVM run so nobody depends on it. `Set.copyOf(collection)` copies; `Collections.unmodifiableSet(s)` is a read-only *view* of a live set.

## Interview angle

- *"How does `HashSet` check membership?"* `hashCode` picks the bucket, `equals` confirms — so both must be overridden consistently.
- *"`HashSet` vs `TreeSet`?"* O(1) unordered vs O(log n) sorted with navigation; `TreeSet` needs comparability and rejects null.
- *"How do you dedupe a list while keeping order?"* `new ArrayList<>(new LinkedHashSet<>(list))`.
- *"What does `add` return?"* Whether the element was absent — the idiom for duplicate detection.
- *"Why is `Set.of` iteration order unpredictable?"* Deliberately randomised so code cannot depend on it.

## Key takeaways

- `HashSet` (fast, unordered), `LinkedHashSet` (insertion order), `TreeSet` (sorted, navigable, no nulls).
- Hash sets need `equals`+`hashCode`; tree sets use `compareTo` only — and disagree with hash sets when it is inconsistent with `equals`.
- `addAll`/`retainAll`/`removeAll` on a copy for union/intersection/difference; `add` returns whether it was new.
- `floor`/`ceiling`/`subSet` are the tree's payoff. Never mutate elements while they are in a set.
