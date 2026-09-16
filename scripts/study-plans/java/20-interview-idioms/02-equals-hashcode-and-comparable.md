---
title: equals, hashCode and Comparable — the contracts that make collections work
minutes: 14
---
Half of the collections framework — `HashMap`, `HashSet`, `contains`, `remove(Object)`, `indexOf`, `distinct()` — depends on `equals` and `hashCode` agreeing; the other half — `TreeMap`, `sort`, `PriorityQueue`, `max` — depends on a consistent ordering. Get the contracts wrong and the symptoms are maddening: a key you just inserted "is not in the map", a set holds two equal objects, a sort throws `IllegalArgumentException: Comparison method violates its general contract`. Interviewers ask about these contracts because every Java developer has been bitten by them. This lesson states them exactly, shows the implementations that satisfy them, and lists the mistakes.

## The `equals` contract

For non-null references: **reflexive** (`a.equals(a)`), **symmetric** (`a.equals(b) == b.equals(a)`), **transitive**, **consistent** (repeated calls agree while nothing changes), and `a.equals(null)` is `false`. The default in `Object` is identity (`==`). Override it when instances are *values* — two `Point(1, 2)`s are the same point — and leave it alone for *entities* whose identity is their existence (a connection, a thread, a session).

```java
@Override public boolean equals(Object o) {
    if (this == o) return true;                          // fast path
    if (o == null || getClass() != o.getClass()) return false;   // or `!(o instanceof Point p)` if subclasses may be equal
    Point p = (Point) o;
    return x == p.x && y == p.y;                         // compare every significant field; Objects.equals for references
}
```

`getClass() !=` versus `instanceof`: `getClass()` makes a `Point` never equal a `ColoredPoint`, which keeps symmetry trivially; `instanceof` lets subclass instances be equal to base instances but makes symmetry your problem (`ColoredPoint.equals(Point)` must then ignore colour). Pick `getClass()` unless you have a reason. The parameter type must be `Object` — `equals(Point p)` is an *overload* that `HashMap` never calls; `@Override` catches this mistake.

## The `hashCode` contract

**Equal objects must have equal hash codes.** Unequal objects *may* share one (a collision), but fewer collisions mean faster maps. `hashCode` must be consistent while the object is unchanged. Override it whenever you override `equals` — a `HashMap` finds the bucket by `hashCode` first and only then calls `equals`, so a class with `equals` but the default identity `hashCode` puts equal keys in different buckets and `get` fails.

```java
@Override public int hashCode() { return Objects.hash(x, y); }            // fine for most classes
@Override public int hashCode() { return 31 * Integer.hashCode(x) + Integer.hashCode(y); }   // the hand-rolled form: no varargs array
```

`Objects.hash` boxes and allocates an array — negligible almost always, avoidable in a hot key class. For arrays use `Arrays.hashCode`/`Arrays.equals` (a plain `array.hashCode()` is identity). `String`, the boxed primitives, `List`, `Set`, `Map`, `Optional`, records and enums all implement both correctly; your own classes are the risk.

**Records** generate `equals`, `hashCode` and `toString` from the components — the fastest correct way to a value class, and the answer to "how would you make this a good map key" nine times out of ten.

## Mutable keys: the silent disaster

```java
Set<List<Integer>> seen = new HashSet<>();
List<Integer> key = new ArrayList<>(List.of(1, 2));
seen.add(key);
key.add(3);
seen.contains(key);        // false — it hashes to a different bucket now
seen.contains(List.of(1, 2)); // also false — the stored key's contents changed
```

The set now contains an entry that no lookup can find and `remove` cannot remove: a leak *and* a bug. The rule: **fields that participate in `equals`/`hashCode` must not change while the object is a key** — best enforced by making the key class immutable (`final` fields, records).

## `Comparable`: the natural order

```java
record Version(int major, int minor) implements Comparable<Version> {
    public int compareTo(Version o) {
        int c = Integer.compare(major, o.major);
        return c != 0 ? c : Integer.compare(minor, o.minor);
    }
}
```

`compareTo` must be **antisymmetric** (`sgn(a.compareTo(b)) == -sgn(b.compareTo(a))`), **transitive**, and consistent; it should be *consistent with `equals`* (`compareTo == 0` iff `equals`) — `TreeSet` and `TreeMap` use only `compareTo`, so two objects that compare equal but are not `equals` collapse into one entry. Use `Integer.compare(a, b)`, never `a - b`: the subtraction overflows for values of opposite sign (`Integer.MIN_VALUE - 1` is positive), which is exactly the "violates its general contract" exception when `TimSort` catches the inconsistency. Compare `double`s with `Double.compare` (handles `NaN` and `-0.0`), strings with `compareTo` or `String.CASE_INSENSITIVE_ORDER`.

## `Comparator`: every other order

```java
Comparator<Employee> byDeptThenSalaryDescThenName =
    Comparator.comparing(Employee::dept)
              .thenComparing(Employee::salary, Comparator.reverseOrder())
              .thenComparing(Employee::name);
list.sort(byDeptThenSalaryDescThenName);
Comparator.comparingInt(String::length);                  // primitive specialisation: no boxing
Comparator.nullsFirst(Comparator.naturalOrder());         // nulls are otherwise an NPE
Comparator.reverseOrder(); comparator.reversed();
```

A `Comparator` is the ordering for one *use* (this sort, this heap), `Comparable` is the type's *one* natural order. Sorting with `Comparator.comparing` chains beats hand-written `compare` methods on readability and is harder to get wrong. `List.sort`/`Arrays.sort` on objects are **stable** (TimSort): equal elements keep their input order, which is why "sort by score, ties by input order" needs no extra key.

## Where each is used

| Needs `equals`/`hashCode` | Needs an order |
| --- | --- |
| `HashMap`, `HashSet`, `LinkedHash*`, `ConcurrentHashMap` | `TreeMap`, `TreeSet`, `PriorityQueue` |
| `List.contains`, `indexOf`, `remove(Object)` | `Collections.sort`, `List.sort`, `Arrays.sort(T[])` |
| `Stream.distinct`, `groupingBy` keys, `toSet` | `Stream.sorted`, `min`, `max`, `Collections.min/max` |
| `Objects.equals`, `assertEquals` in tests | `Arrays.binarySearch` (must be sorted with the same order) |

## Common mistakes, in one place

1. Overriding `equals` without `hashCode` (or vice versa).
2. `equals(MyType other)` — an overload, not an override; use `Object` and `@Override`.
3. `a - b` in `compareTo`; `==` on `Double`/`Integer` fields inside `equals`.
4. Mutating a key after insertion.
5. `compareTo` inconsistent with `equals`, then wondering why a `TreeSet` lost elements.
6. Comparing `double` fields with `==` (`NaN != NaN`; `0.0 == -0.0`); use `Double.compare`.
7. Forgetting that `Arrays.equals` is needed for array fields and `Arrays.deepEquals` for nested arrays.

## Interview angle

- *"What is the `equals`/`hashCode` contract?"* Equal objects must have equal hash codes; `equals` is reflexive, symmetric, transitive, consistent, null-false.
- *"What happens if you override only `equals`?"* Equal keys land in different `HashMap` buckets — lookups fail.
- *"How does `HashMap.get` use them?"* Hash to a bucket, then `equals` along the chain.
- *"`Comparable` versus `Comparator`?"* The type's natural order versus an external, per-use order; `TreeMap` and `PriorityQueue` accept either.
- *"Why not `return a - b` in a comparator?"* Overflow for values of opposite sign breaks antisymmetry; `Integer.compare`.

## Key takeaways

- Override both or neither; parameter type `Object`; compare all significant fields; `Objects.hash`/`Arrays.hashCode`.
- Records give correct value semantics for free — reach for them as map keys.
- Keys must be immutable in their hashed fields.
- `compareTo`: `Integer.compare`/`Double.compare`, transitive, consistent with `equals` for tree collections.
- `Comparator.comparing(...).thenComparing(...)` chains; object sorts are stable.
