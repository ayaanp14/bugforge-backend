---
title: EnumSet and EnumMap
minutes: 10
seo-title: EnumSet and EnumMap in Java: Fast Collections for Enums
description: EnumSet stores enum constants as bits and EnumMap keeps values in an array by ordinal. Why both beat HashSet and HashMap for enums in Java, and the traps.
question: What are EnumSet and EnumMap in Java?
answer: EnumSet and EnumMap are Java collections built for enum types. An `EnumSet` stores membership as bits — one `long` for up to 64 constants — so `contains`, `add` and `remove` are bit operations; an `EnumMap` stores values in an array indexed by `ordinal()`. Both are faster and smaller than `HashSet` and `HashMap`, iterate in declaration order and reject null keys.
q: How do you create an EnumSet in Java?
a: Through static factories, never `new`: `EnumSet.of(Day.SATURDAY, Day.SUNDAY)`, `EnumSet.allOf(Day.class)`, `EnumSet.noneOf(Day.class)` for an empty set, `EnumSet.range(from, to)`, `EnumSet.complementOf(set)` and `EnumSet.copyOf(collection)`. The result is an ordinary mutable `Set`.
q: Why use EnumMap instead of HashMap in Java?
a: With enum keys an `EnumMap` is an array read at the key's ordinal — no hashing — so it is faster and smaller, iterates keys in declaration order, and says in its type that the key set is closed. Create it with the class token: `new EnumMap<>(Status.class)`.
q: Why does EnumSet.copyOf throw on an empty list?
a: `EnumSet.copyOf(collection)` needs at least one element to learn the enum type unless the argument is itself an `EnumSet`, so an empty plain collection throws `IllegalArgumentException`. Check for empty and use `EnumSet.noneOf(Type.class)` in that case.
q: How do you represent a set of flags in Java?
a: Use an `EnumSet` of an enum such as `Permission`. It is a bit vector underneath, like an integer bitmask, but type-safe and readable, with the full `Set` API — `contains`, `addAll` for union and `retainAll` for intersection. Effective Java recommends it over `int` flags.
---
A set of days, a map from status to count, a bitmask of permissions — collections keyed by enum constants are everywhere, and Java has two classes built for exactly that shape. `EnumSet` stores membership as bits; `EnumMap` stores values in an array indexed by ordinal. Both are faster and smaller than their hash-based cousins, iterate in declaration order, and are what a reviewer expects to see wherever the element or key type is an enum.

## `EnumSet`

```java
EnumSet<Day> weekend = EnumSet.of(Day.SATURDAY, Day.SUNDAY);
EnumSet<Day> weekdays = EnumSet.complementOf(weekend);
EnumSet<Day> all = EnumSet.allOf(Day.class);
EnumSet<Day> none = EnumSet.noneOf(Day.class);              // an empty set of Days
EnumSet<Day> midweek = EnumSet.range(Day.TUESDAY, Day.THURSDAY);
EnumSet<Day> copy = EnumSet.copyOf(someCollectionOfDays);

weekend.contains(Day.SUNDAY)        // true — a bit test
weekdays.add(Day.SATURDAY);         // it is a normal mutable Set
for (Day d : weekdays) …            // declaration order: MONDAY … FRIDAY
```

Inside, an `EnumSet` of up to 64 constants is a single `long`; membership, add and remove are bit operations, union and intersection (`addAll`, `retainAll`) are `|` and `&`. Larger enums use a `long[]`. It is a full `Set<E>` — `size`, `removeIf`, `stream()` all work — with iteration in ordinal order. It does not accept `null`.

Use it for: flag sets (`EnumSet<Permission>`), "which days" / "which options" selections, and any `Set` whose element type is an enum. It replaces integer bitmasks (`FLAG_A | FLAG_B`) with something type-safe and readable — *Effective Java* item 36.

There is no immutable `EnumSet`; wrap with `Collections.unmodifiableSet` or copy defensively.

## `EnumMap`

```java
EnumMap<Status, Integer> counts = new EnumMap<>(Status.class);      // the class token is required
for (Order o : orders) counts.merge(o.status(), 1, Integer::sum);

counts.get(Status.ACTIVE)            // an array read at index ordinal()
counts.keySet()                      // in declaration order
counts.getOrDefault(Status.CLOSED, 0)
```

An `EnumMap` is an `Object[]` of size `values().length`; `get` and `put` index by ordinal with no hashing and no boxing of the key. Keys iterate in declaration order. Null keys are rejected; null values are allowed.

Use it for: counts and tallies per constant, lookup tables keyed by enum (`EnumMap<Level, Color>`), state-machine transition tables (`EnumMap<State, EnumSet<State>>`). Compared with a `HashMap<Status, Integer>` it is faster, smaller, ordered, and says in its type that the key set is closed.

## Why not `ordinal()` and an array?

```java
int[] counts = new int[Status.values().length];
counts[status.ordinal()]++;             // works — and is exactly what EnumMap does internally
```

The manual version couples the code to ordinal order and needs a comment; `EnumMap` says the same thing in the type system with a real `Map` API. Reach for the raw array only in a measured hot loop.

## `Enum.valueOf`, `EnumSet` and `switch` together

A typical flags-style API:

```java
public enum Permission { READ, WRITE, DELETE, ADMIN }

public final class Role {
    private final EnumSet<Permission> permissions;
    public Role(Collection<Permission> ps) { this.permissions = ps.isEmpty() ? EnumSet.noneOf(Permission.class) : EnumSet.copyOf(ps); }
    public boolean can(Permission p) { return permissions.contains(p); }
    public Set<Permission> permissions() { return Collections.unmodifiableSet(permissions); }
}
```

`EnumSet.copyOf(collection)` throws on an empty non-`EnumSet` collection (it cannot infer the element type), hence the `noneOf` branch — a small trap worth knowing.

## Streams and enums

```java
Map<Status, Long> tally = orders.stream()
    .collect(Collectors.groupingBy(Order::status, () -> new EnumMap<>(Status.class), Collectors.counting()));
```

`groupingBy` with a map factory produces an `EnumMap`; without it you get a `HashMap` in arbitrary order. `Collectors.toCollection(() -> EnumSet.noneOf(Day.class))` does the same for sets.

## Performance in one table

| Operation | `HashSet`/`HashMap` | `EnumSet`/`EnumMap` |
| --- | --- | --- |
| contains / get | hash + equals | one bit test / one array read |
| Memory per element | entry object + boxing | one bit / one array slot |
| Iteration order | unspecified | declaration order |
| Null elements/keys | allowed | rejected |

## Interview angle

- *"How would you represent a set of flags type-safely?"* `EnumSet<Flag>` — a bit vector under a `Set` API.
- *"Why prefer `EnumMap` to `HashMap` for enum keys?"* Array indexing by ordinal: faster, smaller, ordered.
- *"What does `EnumSet.copyOf(emptyList)` do?"* Throws `IllegalArgumentException` — use `noneOf(Class)` for empties.
- *"Is `EnumSet` thread-safe?"* No, like the other basic collections; wrap or copy.

## Key takeaways

- `EnumSet`: bit-vector `Set` of enum constants — `of`, `allOf`, `noneOf`, `complementOf`, `range`; ordinal-order iteration; no nulls.
- `EnumMap`: array-backed `Map` keyed by enum — pass the class token; ordered; fast tallies and lookup tables.
- Both replace hash collections wherever the element/key is an enum, and replace integer bitmasks and ordinal-indexed arrays.
- `copyOf` of an empty plain collection throws; `groupingBy` takes a map factory for `EnumMap`.
