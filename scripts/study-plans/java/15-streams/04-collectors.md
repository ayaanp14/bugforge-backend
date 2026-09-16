---
title: Collectors — toMap, joining, groupingBy, partitioningBy
minutes: 16
---
`collect` is the terminal that builds something: a list, a set, a map, a string, a summary. Its argument is a `Collector` — a recipe with a supplier (make the container), an accumulator (add one element), a combiner (merge two containers, for parallel) and a finisher (convert at the end). You will write your own perhaps once a year; you will use the ones in `java.util.stream.Collectors` every day, and `groupingBy` with a downstream collector is the single most useful line in the whole streams API. This lesson is that toolbox.

## The basics

```java
import static java.util.stream.Collectors.*;

List<String> list   = s.collect(toList());
Set<String> set     = s.collect(toSet());                      // a HashSet: no order
Set<String> ordered = s.collect(toCollection(TreeSet::new));   // any collection you name
Deque<String> dq    = s.collect(toCollection(ArrayDeque::new));
```

Static-import `Collectors.*` in code that uses several; a pipeline reads far better as `groupingBy(..., counting())` than with the class name repeated four times.

## `toMap` — and the two traps

```java
Map<String, Integer> lengths = words.stream().collect(toMap(w -> w, String::length));
```

Trap one: **duplicate keys throw** `IllegalStateException: Duplicate key`. Fix with a merge function:

```java
Map<String, Integer> counts = words.stream().collect(toMap(w -> w, w -> 1, Integer::sum));
Map<Character, String> byInitial = words.stream().collect(toMap(w -> w.charAt(0), w -> w, (a, b) -> a));  // keep the first
```

Trap two: the map is a `HashMap`, so **iteration order is unspecified**. Name the map type with the four-argument form:

```java
Map<String, Integer> inOrder = words.stream().collect(toMap(w -> w, String::length, (a, b) -> a, LinkedHashMap::new));
TreeMap<String, Integer> sorted = words.stream().collect(toMap(w -> w, String::length, (a, b) -> a, TreeMap::new));
```

Also: `toMap` rejects `null` values with a `NullPointerException` (it uses `Map.merge` internally). And `Function.identity()` is the idiomatic spelling of `w -> w` for the key.

## `joining` — strings without a `StringBuilder`

```java
String csv    = names.stream().collect(joining(", "));                  // "ann, bob, cy"
String pretty = names.stream().collect(joining(", ", "[", "]"));        // "[ann, bob, cy]"
String all    = names.stream().collect(joining());                       // "annbobcy"
```

Elements must be `CharSequence`s — `map(String::valueOf)` or `map(Object::toString)` first for anything else. `String.join(", ", list)` does the same without a stream when there is nothing to filter or map.

## `groupingBy` — the one to master

`groupingBy(classifier)` puts elements into a `Map<K, List<T>>` keyed by what the classifier returns:

```java
Map<Integer, List<String>> byLength = words.stream().collect(groupingBy(String::length));
// {3=[ann, bob], 5=[carol]}
```

Add a **downstream collector** to say what to do with each group instead of listing it:

```java
Map<Integer, Long> countByLength     = words.stream().collect(groupingBy(String::length, counting()));
Map<String, Integer> totalByCity     = people.stream().collect(groupingBy(Person::city, summingInt(Person::age)));
Map<String, Double> avgAgeByCity     = people.stream().collect(groupingBy(Person::city, averagingInt(Person::age)));
Map<String, Set<String>> namesByCity = people.stream().collect(groupingBy(Person::city, mapping(Person::name, toSet())));
Map<String, Optional<Person>> oldest = people.stream().collect(groupingBy(Person::city, maxBy(comparingInt(Person::age))));
Map<String, List<String>> sortedNames = people.stream().collect(groupingBy(Person::city, TreeMap::new, mapping(Person::name, toList())));
```

The three-argument form names the map (`TreeMap::new` for sorted keys, `LinkedHashMap::new` for first-seen order). Groups can nest: `groupingBy(Person::country, groupingBy(Person::city, counting()))` gives `Map<String, Map<String, Long>>`.

The keys are whatever the classifier returns, so `groupingBy(w -> w.charAt(0))` groups by first letter, `groupingBy(n -> n % 3)` by remainder, and `groupingBy(p -> p.age() / 10 * 10)` by decade. A `null` classifier result throws — map it to a sentinel first.

## `partitioningBy` — exactly two groups

```java
Map<Boolean, List<Integer>> evenOdd = nums.stream().collect(partitioningBy(n -> n % 2 == 0));
Map<Boolean, Long> passFail = scores.stream().collect(partitioningBy(s -> s >= 50, counting()));
```

A `partitioningBy` map **always has both keys**, `true` and `false`, even when one side is empty — `groupingBy` on a boolean would omit an empty group. That is the reason to prefer it for yes/no splits.

## Downstream collectors worth knowing

| Collector | Produces |
| --- | --- |
| `counting()` | `Long` |
| `summingInt/Long/Double(f)` | the sum |
| `averagingInt/Long/Double(f)` | `Double` |
| `minBy(cmp)`, `maxBy(cmp)` | `Optional<T>` |
| `mapping(f, downstream)` | apply `f` first, then collect |
| `filtering(pred, downstream)` (Java 9) | filter inside the group |
| `flatMapping(f, downstream)` (Java 9) | flatten inside the group |
| `reducing(identity, op)` | a fold per group |
| `summarizingInt(f)` | `IntSummaryStatistics`: count, sum, min, max, average in one pass |
| `collectingAndThen(downstream, finisher)` | post-process: `collectingAndThen(toList(), Collections::unmodifiableList)` |
| `teeing(c1, c2, merger)` (Java 12) | run two collectors over the same elements and merge |

`teeing` deserves an example, because it removes the "two passes for two facts" problem:

```java
record MinMax(int min, int max) {}
MinMax mm = nums.stream().collect(teeing(
    minBy(Integer::compare), maxBy(Integer::compare),
    (lo, hi) -> new MinMax(lo.orElseThrow(), hi.orElseThrow())));
```

## Writing a collector

```java
Collector<String, StringBuilder, String> concat =
    Collector.of(StringBuilder::new, StringBuilder::append, StringBuilder::append, StringBuilder::toString);
```

Supplier, accumulator, combiner, finisher. You will rarely need it — but knowing the shape explains why `collect` is allowed to mutate (the container is yours) while `reduce` is not.

## `collect` versus `reduce`, settled

`reduce` folds immutable values: new value in, new value out. `collect` fills a mutable container. Reducing into an `ArrayList` "works" sequentially and breaks in parallel; collecting into one is exactly what the combiner is for. Rule: if the accumulator mutates its first argument, it is a collector.

## Interview angle

- *"What happens on duplicate keys in `toMap`?"* `IllegalStateException` — supply a merge function.
- *"`groupingBy` returns…?"* `Map<K, List<T>>` by default; a downstream collector replaces the `List`.
- *"`partitioningBy` versus `groupingBy` on a boolean?"* `partitioningBy` always has both keys.
- *"How do you count occurrences of each word?"* `groupingBy(identity(), counting())` — or `toMap(w -> w, w -> 1, Integer::sum)`.
- *"Why does `collect` accept a mutable container when `reduce` does not?"* A collector has a combiner that merges containers, so parallel chunks never share one.

## Key takeaways

- `toMap` throws on duplicates and gives a `HashMap`; add a merge function and a map supplier when you care.
- `joining(sep, prefix, suffix)` for strings; `String.join` when there is no pipeline.
- `groupingBy(classifier, mapFactory, downstream)` — memorise the shape; `counting`, `mapping`, `summingInt`, `maxBy` as downstreams.
- `partitioningBy` for two-way splits; both keys always present.
- `teeing` for two facts in one pass; `collectingAndThen` to finish; `Collector.of` when the library has no fit.
