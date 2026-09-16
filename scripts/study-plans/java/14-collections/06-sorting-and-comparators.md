---
title: Sorting, Comparable and Comparator in depth
minutes: 13
---
Sorting a list of objects in Java is one line once you know the comparator vocabulary — `comparing`, `thenComparing`, `reversed`, `nullsFirst` — and a page of bugs if you do not. This lesson covers the sort entry points, how to build any ordering declaratively, stability, the contract a comparator must satisfy, and binary search on sorted data.

## The entry points

```java
Collections.sort(list);                     // natural order — elements must be Comparable
Collections.sort(list, comparator);
list.sort(null);                            // natural order (Java 8; what Collections.sort calls)
list.sort(comparator);
Arrays.sort(array);                         // primitives: dual-pivot quicksort; objects: TimSort
Arrays.sort(objects, comparator);
list.stream().sorted(comparator).toList();  // a new sorted list; the source is untouched
new TreeSet<>(comparator); new TreeMap<>(comparator); new PriorityQueue<>(comparator);   // structures that stay sorted
```

Object sorts use **TimSort**: O(n log n), **stable** (equal elements keep their relative order), and fast on partially sorted input. Primitive array sorts use quicksort — unstable, which is irrelevant for values that are just numbers.

## Natural order: `Comparable`

Implement `Comparable<T>` on types with one obvious order (Module 9): compare the most significant field first with `Integer.compare`/`Double.compare`/`compareTo`, and keep it consistent with `equals`. `String`, the wrappers, `LocalDate`, `BigDecimal`, enums (by ordinal) and `UUID` are all `Comparable`.

## Building comparators

```java
Comparator<Person> byAge   = Comparator.comparingInt(Person::age);        // primitive specialisation: no boxing
Comparator<Person> byName  = Comparator.comparing(Person::lastName);
Comparator<Person> byNameCi = Comparator.comparing(Person::lastName, String.CASE_INSENSITIVE_ORDER);   // key + comparator for the key
Comparator<Person> byAgeDesc = byAge.reversed();
Comparator<Person> full = byNameCi.thenComparing(Person::firstName).thenComparingInt(Person::age);
Comparator<Person> nicknameLast = Comparator.comparing(Person::nickname, Comparator.nullsLast(Comparator.naturalOrder()));

people.sort(full);
people.sort(Comparator.comparing(Person::score).reversed().thenComparing(Person::name));   // score desc, then name asc
```

- `comparing(keyExtractor)` orders by a `Comparable` key; `comparing(keyExtractor, keyComparator)` supplies how to compare the keys.
- `comparingInt`/`comparingLong`/`comparingDouble` avoid boxing.
- `thenComparing` chains tie-breakers; `reversed()` flips the comparator built so far.
- `nullsFirst`/`nullsLast` wrap a comparator to tolerate null *elements*; for null *keys*, wrap the key comparator as above.
- `naturalOrder()` and `reverseOrder()` are the `Comparable`-based ones.

The inference trap from Module 13: `Comparator.comparing(Person::lastName).reversed()` sometimes fails to infer `Person`; write `Comparator.comparing((Person p) -> p.lastName()).reversed()` or assign the first comparator to a typed variable.

## Writing a comparator by hand

```java
Comparator<Person> byAgeThenName = (a, b) -> {
    int c = Integer.compare(a.age(), b.age());
    return c != 0 ? c : a.name().compareTo(b.name());
};
```

Rules a comparator must obey (the `Comparator` contract): antisymmetric, transitive, and consistent — `compare(a, b)` must give the same sign every time. Violations produce `IllegalArgumentException: Comparison method violates its general contract!` from TimSort, or silently wrong orders. The classic violation is `a.age() - b.age()` on values that can overflow; use `Integer.compare`. Another is comparing doubles with `<`/`>` and returning 0 for `NaN` inconsistently; use `Double.compare`.

## Stability, and why it matters

Stable sorts preserve the input order of equal elements. Sorting by last name a list already sorted by first name yields "last name, then first name" for free — the basis of multi-pass sorting. `List.sort` and `Arrays.sort(Object[])` are stable; `Arrays.sort(int[])` is not (and need not be); `Stream.sorted()` is stable for ordered streams.

## Sorting maps

Maps have no sort; sort their entries:

```java
List<Map.Entry<String, Integer>> entries = new ArrayList<>(counts.entrySet());
entries.sort(Map.Entry.<String, Integer>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()));
// or keep a TreeMap for key order; or stream: counts.entrySet().stream().sorted(Map.Entry.comparingByValue())
```

`Map.Entry.comparingByKey()`/`comparingByValue()` (with optional comparators) are the helpers.

## Sorting in reverse and by multiple keys with mixed directions

```java
list.sort(Comparator.comparingInt(Person::age).reversed().thenComparing(Person::name));            // age desc, name asc
list.sort(Comparator.comparing(Person::name).thenComparing(Comparator.comparingInt(Person::age).reversed()));   // name asc, age desc
```

`reversed()` applies to everything chained *before* it; to reverse only a later key, pass a reversed comparator into `thenComparing`.

## Binary search on sorted data

```java
Collections.sort(list);
int i = Collections.binarySearch(list, target);               // natural order; -(insertion) - 1 if absent
int j = Collections.binarySearch(list, target, comparator);   // must be the SAME comparator used to sort
int k = Arrays.binarySearch(sortedArray, target);
```

Binary search is O(log n) and correct only on data sorted by the same ordering. A negative result encodes the insertion point — useful for "first element ≥ target".

## Performance notes

- Sorting is O(n log n); do it once, not inside a loop. Keep a `TreeMap`/`TreeSet`/`PriorityQueue` if the data must *stay* ordered under inserts.
- `comparing(Person::name)` calls the key extractor O(n log n) times; if the key is expensive to compute, precompute it (decorate-sort-undecorate) or cache it.
- Prefer `comparingInt` over `comparing` for primitive keys.
- `Collections.sort` on a `LinkedList` copies to an array, sorts, and writes back — fine, but another reason not to use `LinkedList`.

## Interview angle

- *"How do you sort by two fields?"* `Comparator.comparing(a).thenComparing(b)`, or a hand-written two-step compare.
- *"What algorithm does Java use?"* TimSort for objects (stable), dual-pivot quicksort for primitives.
- *"What is a stable sort?"* Equal elements keep their input order — enables multi-key sorting by successive passes.
- *"Why not `return a - b` in a comparator?"* Overflow flips the sign for large values of opposite sign.
- *"What does `reversed()` reverse?"* Everything chained before it.

## Key takeaways

- `list.sort(cmp)`, `Arrays.sort`, `stream().sorted` — stable TimSort for objects.
- Build orderings with `comparing`/`comparingInt`, `thenComparing`, `reversed`, `nullsFirst/Last`, `naturalOrder/reverseOrder`; type the first lambda when inference fails.
- Comparators must be consistent and transitive: `Integer.compare`/`Double.compare`, never subtraction.
- Sort map entries with `Map.Entry.comparingByValue/Key`; binary search only with the same ordering.
