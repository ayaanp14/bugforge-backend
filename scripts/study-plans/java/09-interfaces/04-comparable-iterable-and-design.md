---
title: Comparable, Iterable and designing with interfaces
minutes: 14
---
Two interfaces from the JDK teach more about interface design than any abstract discussion: `Comparable`, which gives a type a natural order, and `Iterable`, which lets it be looped over with for-each. Implementing both correctly is expected of any value type you write, and both illustrate how a small contract unlocks a large amount of library behaviour. The second half of the lesson turns those lessons into guidelines for interfaces of your own.

## `Comparable<T>`: natural order

```java
public final class Version implements Comparable<Version> {
    private final int major, minor, patch;

    @Override
    public int compareTo(Version o) {
        int c = Integer.compare(major, o.major);
        if (c != 0) return c;
        c = Integer.compare(minor, o.minor);
        if (c != 0) return c;
        return Integer.compare(patch, o.patch);
    }
}
```

`compareTo` returns negative, zero or positive for less-than, equal, greater-than. The contract:

- **Antisymmetric**: `sgn(a.compareTo(b)) == -sgn(b.compareTo(a))`.
- **Transitive**.
- **Consistent with equals** (strongly recommended): `a.compareTo(b) == 0` iff `a.equals(b)`. `TreeSet` and `TreeMap` use `compareTo` *instead of* `equals`, so an inconsistency means a `TreeSet` and a `HashSet` disagree about which elements are duplicates. `BigDecimal` (`2.0` vs `2.00`) is the standard cautionary example.
- Throws `NullPointerException` for a null argument (it is not meant to handle null).

Idioms: compare fields most-significant first; use `Integer.compare`/`Long.compare`/`Double.compare`, never subtraction (overflow) or `==` on doubles; for strings `compareTo` or `compareToIgnoreCase`; for a chain of fields, `Comparator.comparing(...).thenComparing(...)` inside `compareTo` reads well:

```java
private static final Comparator<Version> ORDER =
    Comparator.comparingInt((Version v) -> v.major).thenComparingInt(v -> v.minor).thenComparingInt(v -> v.patch);
@Override public int compareTo(Version o) { return ORDER.compare(this, o); }
```

What implementing it buys: `Collections.sort(list)`, `Arrays.sort(array)`, `list.sort(null)`, `Collections.max/min`, `TreeSet`/`TreeMap` keys, `stream().sorted()`, `PriorityQueue` ordering — all without passing a comparator.

## `Comparator<T>`: other orders

A type has one natural order but many useful ones. `Comparator` is an external ordering passed to the sort:

```java
list.sort(Comparator.comparing(Person::lastName).thenComparing(Person::firstName));
list.sort(Comparator.comparingInt(Person::age).reversed());
list.sort(Comparator.comparing(Person::nickname, Comparator.nullsLast(Comparator.naturalOrder())));
```

Implement `Comparable` for *the* order (if there is one obvious order); supply `Comparator`s for the rest. A class with no obvious order (`Employee`?) should implement neither and let callers pass comparators.

## `Iterable<T>`: for-each over your type

```java
public class Range implements Iterable<Integer> {
    private final int lo, hi;
    public Range(int lo, int hi) { this.lo = lo; this.hi = hi; }

    @Override
    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            private int next = lo;
            @Override public boolean hasNext() { return next < hi; }
            @Override public Integer next() {
                if (!hasNext()) throw new NoSuchElementException();
                return next++;
            }
        };
    }
}

for (int i : new Range(0, 5)) System.out.print(i);     // 01234
```

The for-each loop desugars to `for (Iterator<T> it = x.iterator(); it.hasNext(); ) { T v = it.next(); … }`. Implementing `Iterable` means providing an `Iterator` — an object with `hasNext()`/`next()` (and optionally `remove()`). Rules: `next()` without a preceding successful `hasNext()` must throw `NoSuchElementException`, not return garbage; each call to `iterator()` returns a fresh, independent iterator; `Iterable` also gives you `forEach(Consumer)` and `spliterator()` as defaults, so `StreamSupport.stream(range.spliterator(), false)` opens streams.

Lazy iteration is the point: `Range` never materialises a list. Iterators over trees, files and generated sequences all follow this shape.

## Guidelines for your own interfaces

1. **Small.** One to five methods. `Comparable` has one; `Iterable` has one. A twenty-method interface is implemented rarely and mocked painfully. Split by role (**interface segregation**): `Readable` and `Writable`, not `ReadWritable`.
2. **Named for the capability.** `Closeable`, `Runnable`, `Repository<T>`, `Shape`. Avoid `I` prefixes and `Impl` suffixes; `ArrayList implements List`, not `ListImpl implements IList`.
3. **Stable.** Adding abstract methods breaks implementors; add default methods or a new interface (`SortedSet extends Set`).
4. **Documented contracts.** What `compareTo(null)` does, whether `iterator()` is repeatable, whether `close()` is idempotent — the Javadoc is the real interface.
5. **Depend on interfaces at boundaries.** Parameters and return types of public APIs should be interfaces (`List`, not `ArrayList`; `Map`, not `HashMap`) so callers and implementations can change independently.
6. **Provide a skeleton** when the interface has many methods derivable from a few (`AbstractList`), or defaults when they derive from the abstract ones.
7. **One method → consider functional.** If it is a single operation, a functional interface lets callers use lambdas.

## Interfaces and testing

An interface at a boundary — `PaymentGateway`, `Clock`, `Repository` — is what makes the code that uses it testable: the test supplies a fake implementation (`InMemoryRepository`, a fixed `Clock`) and exercises the logic without a network or a database. This is the practical reason for "program to an interface" in application code: not flexibility for its own sake, but substitutability where it matters. `java.time.Clock` is the JDK's own example.

## Anti-patterns

- **Header interfaces**: one interface per class, mirroring every method, implemented once. Noise without substitutability.
- **Constant interfaces** (Module 9 lesson 1).
- **God interfaces** implemented by throwing `UnsupportedOperationException` from half the methods — the Liskov violation in interface form. (`Collection` does exactly this for optional operations and is widely regarded as a compromise, not a model.)
- **Leaking implementation types** through interface methods (`ArrayList<T> items()` on an interface).

## Interview angle

- *"`Comparable` vs `Comparator`?"* Natural order inside the class vs external orderings passed to sorts; one vs many.
- *"Why must `compareTo` be consistent with `equals`?"* Sorted collections use `compareTo` to decide duplicates.
- *"How does for-each work on your class?"* Implement `Iterable`; the loop calls `iterator()`, then `hasNext`/`next`.
- *"What is interface segregation?"* Small, role-specific interfaces so implementors depend only on what they use.

## Key takeaways

- `Comparable.compareTo`: most significant field first, `Integer.compare`, consistent with `equals`; unlocks sorting and sorted collections.
- `Comparator` for every other ordering; build with `comparing`/`thenComparing`/`reversed`.
- `Iterable.iterator()` returning a fresh `Iterator` gives for-each and `forEach`; `next()` past the end throws.
- Design interfaces small, capability-named, stable, documented, and use them at boundaries — that is also what makes code testable.
