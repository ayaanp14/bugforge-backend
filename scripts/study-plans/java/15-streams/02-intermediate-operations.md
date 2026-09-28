---
title: Intermediate operations — map, filter, flatMap and friends
minutes: 14
seo-title: Map vs FlatMap in Java Streams: Filter, Sorted, Distinct
description: Stream intermediate operations in Java: filter keeps, map transforms one to one, flatMap flattens one to many, sorted and distinct buffer, and limit truncates.
question: What is the difference between map and flatMap in Java streams?
answer: In Java streams, `map` transforms each element into exactly one new element, so a stream of n elements stays n long. `flatMap` transforms each element into a stream of zero or more elements and concatenates those streams into one. Use `flatMap` whenever `map` would give you a `Stream<List<X>>` or `Stream<Stream<X>>` and you wanted a `Stream<X>`.
q: Which stream operations are stateful in Java?
a: `sorted` and `distinct` are stateful: they must buffer elements — `sorted` all of them — before emitting results, so `sorted()` on an infinite stream never returns. `limit` and `skip` also track a count. `filter`, `map` and `flatMap` are stateless.
q: Why can't I call `sum()` after `map` on a Java stream?
a: `map(String::length)` produces a `Stream<Integer>`, and object streams have no `sum()`. Use `mapToInt(String::length)` instead, which gives an `IntStream` with `sum`, `average`, `min` and `max` and avoids boxing.
q: What does `peek` do in a Java stream?
a: `peek` runs an action on each element as it passes, without changing it, and is meant for debugging. It is lazy like every intermediate operation: nothing happens without a terminal, and a short-circuiting terminal sees only some elements. Do not use it for real side effects.
q: What is the difference between `limit` and `takeWhile`?
a: `limit(n)` keeps at most the first n elements. `takeWhile(predicate)`, added in Java 9, keeps elements while the condition holds and stops at the first that fails, so the data decides where the stream ends rather than a count. Both make infinite streams finite.
q: How does `distinct` decide duplicates in a stream?
a: With `equals` and `hashCode`, keeping the first occurrence in encounter order: `Stream.of(3, 1, 3, 2).distinct()` gives 3, 1, 2. Elements without proper `equals` and `hashCode` are never treated as duplicates, so fix the class or use a record.
---
Intermediate operations are the verbs of a pipeline: keep, transform, flatten, order, deduplicate, truncate. Each returns a new stream and runs lazily. Most are one-to-one and stateless; a few (`sorted`, `distinct`) must buffer; `flatMap` is the one people take longest to internalise. This lesson covers each operation with its signature, its typical use, and the mistake it invites.

## `filter` — keep elements matching a predicate

```java
orders.stream().filter(o -> o.total() > 100).filter(Order::isPaid)     // two filters = AND; or one with &&
words.stream().filter(Predicate.not(String::isBlank))
```

`Stream<T> filter(Predicate<? super T>)`. Never mutates; elements failing the test simply do not continue downstream.

## `map` — transform each element

```java
people.stream().map(Person::name)                 // Stream<Person> → Stream<String>
strings.stream().map(String::length)              // Stream<String> → Stream<Integer>
strings.stream().mapToInt(String::length)         // → IntStream: no boxing, gets sum()/max()/average()
ints.mapToObj(i -> "#" + i)                       // IntStream → Stream<String>
intStream.boxed()                                 // IntStream → Stream<Integer>
```

`<R> Stream<R> map(Function<? super T, ? extends R>)`. One in, one out, same count. Use `mapToInt`/`mapToLong`/`mapToDouble` when the result is numeric and you want arithmetic terminals; `boxed()` to get back to objects for collectors.

## `flatMap` — one-to-many, flattened

```java
List<List<String>> nested = …;
nested.stream().flatMap(List::stream)                          // Stream<List<String>> → Stream<String>
sentences.stream().flatMap(s -> Arrays.stream(s.split(" ")))   // words from sentences
orders.stream().flatMap(o -> o.lines().stream())               // all order lines
people.stream().flatMap(p -> p.phones().stream()).distinct()   // every phone, once
Optional.of(x).stream()                                         // 0 or 1 elements
```

`<R> Stream<R> flatMap(Function<? super T, ? extends Stream<? extends R>>)`. The function returns a **stream** per element; `flatMap` concatenates them. Rule of thumb: when `map` would give you a `Stream<Stream<X>>` or `Stream<List<X>>` and you wanted `Stream<X>`, you needed `flatMap`. Java 16's `mapMulti` is an imperative alternative for the same job.

## `sorted` — order (stateful)

```java
.sorted()                                                  // natural order; elements must be Comparable
.sorted(Comparator.comparing(Person::lastName).reversed())
```

Buffers the entire stream, sorts, then emits. O(n log n), stable. Anything after it (`limit`) still benefits from laziness downstream; nothing upstream of it does. Sorting then `limit(k)` is fine for small k; for huge inputs a `PriorityQueue` top-k is cheaper.

## `distinct` — remove duplicates (stateful)

Uses `equals`/`hashCode`; keeps the first occurrence in encounter order. Buffers what it has seen. `Stream.of(3, 1, 3, 2).distinct()` → 3, 1, 2.

## `limit` and `skip` — truncate

```java
.limit(10)                      // at most 10 — short-circuits; makes infinite streams finite
.skip(5)                        // drop the first 5
.skip(page * size).limit(size)  // pagination
```

`limit` is what makes `Stream.iterate`/`generate` safe. Both respect encounter order.

## `takeWhile` and `dropWhile` (Java 9)

```java
Stream.iterate(1, x -> x * 2).takeWhile(x -> x < 100)      // 1 2 4 … 64 — stops at the first failure
sortedNumbers.stream().dropWhile(x -> x < 0)               // skip the leading negatives
```

Condition-based prefixes rather than counts. On an unordered stream they take/drop an arbitrary subset satisfying the predicate.

## `peek` — observe without changing

```java
.peek(x -> log.debug("saw {}", x))
```

For debugging. It is lazy like everything else — nothing prints without a terminal, and short-circuiting terminals see only some elements. Do not use it for real side effects.

## Numeric conversions

`mapToInt`, `mapToLong`, `mapToDouble` produce primitive streams with `sum`, `average`, `min`, `max`, `summaryStatistics`; `asLongStream`, `asDoubleStream` widen; `boxed` and `mapToObj` return to objects. Lesson 6 covers primitive streams; note here that `map(String::length)` gives a `Stream<Integer>` with no `sum()`, while `mapToInt(String::length)` gives an `IntStream` that has one.

## Ordering and `unordered`

Streams from lists have an *encounter order* that `map`/`filter`/`limit`/`sorted` preserve. `HashSet` sources have none. `unordered()` tells the runtime order does not matter, which lets `distinct` and `limit` run faster in parallel. Sequential pipelines rarely need it.

## `parallel` / `sequential`

`stream().parallel()` (or `parallelStream()`) switches the pipeline to run across the common fork-join pool. It is an intermediate operation in form and a global switch in effect — the whole pipeline is parallel. Lesson 6 covers when that helps and when it hurts.

## Composition patterns

```java
// top 3 longest distinct words, lower-cased
words.stream().map(String::toLowerCase).distinct()
     .sorted(Comparator.comparingInt(String::length).reversed().thenComparing(Comparator.naturalOrder()))
     .limit(3).toList();

// all unique tags across posts
posts.stream().flatMap(p -> p.tags().stream()).distinct().sorted().toList();

// first even square greater than 1000
IntStream.iterate(1, i -> i + 1).map(i -> i * i).filter(sq -> sq % 2 == 0 && sq > 1000).findFirst();
```

Read each pipeline top to bottom as a sentence; if a stage needs a comment, extract its lambda into a named method.

## Mistakes

| Mistake | Fix |
| --- | --- |
| `map(x -> list.add(x))` — side effect in `map` | Use `forEach` or `collect` |
| `map(List::stream)` giving `Stream<Stream<T>>` | `flatMap` |
| `sorted()` on an infinite stream | `limit` before sorting, or don't |
| `map(String::length).sum()` — no `sum` on `Stream<Integer>` | `mapToInt` |
| Reusing a stream after `filter`/`map` assigned to a variable and consumed | Build a new stream |
| `distinct()` on elements without `equals`/`hashCode` | Fix the element class or use a record |

## Interview angle

- *"`map` vs `flatMap`?"* One-to-one vs one-to-many with flattening; `flatMap`'s function returns a stream.
- *"Which intermediate operations are stateful?"* `sorted`, `distinct` (and `limit`/`skip` in a sense, as they track counts).
- *"Does `filter` run before or after `map`?"* In pipeline order, element by element — put the cheaper/more selective filter first.
- *"What does `peek` do?"* Applies a consumer to each element passing through, for debugging; lazy.
- *"Why `mapToInt`?"* Primitive stream: no boxing and numeric terminals like `sum`.

## Key takeaways

- `filter` keeps, `map` transforms one-to-one, `flatMap` transforms one-to-many and flattens.
- `sorted`/`distinct` buffer; `limit`/`skip`/`takeWhile`/`dropWhile` truncate; `limit` tames infinite sources.
- `mapToInt`/`mapToObj`/`boxed` move between object and primitive streams.
- Order filters early; no side effects in `map`; `peek` only for debugging.
