---
title: Streams — pipelines over data
minutes: 13
---
A stream is a pipeline: a **source** of elements, zero or more **intermediate** operations that transform or filter them lazily, and one **terminal** operation that produces a result. `names.stream().filter(n -> n.startsWith("A")).map(String::toUpperCase).toList()` says *what* to compute — no index, no accumulator, no loop body — and that declarative shape is why streams took over Java collection code after Java 8. This lesson is the model: what a stream is and is not, the three kinds of operation, laziness, and the rules (single use, no side effects) that keep pipelines correct.

## Anatomy of a pipeline

```java
List<String> result = people.stream()                    // source
    .filter(p -> p.age() >= 18)                          // intermediate: keep some
    .map(Person::name)                                   // intermediate: transform each
    .sorted()                                            // intermediate: stateful
    .limit(10)                                           // intermediate: short-circuiting
    .toList();                                           // terminal: produce the result
```

- **Source**: a collection (`.stream()`), an array (`Arrays.stream`), literal values (`Stream.of`), a range (`IntStream.range`), a generator (`Stream.iterate`, `Stream.generate`), lines of a file (`Files.lines`), characters (`s.chars()`), a map's views (`map.entrySet().stream()`).
- **Intermediate operations** return a new stream and do **nothing yet**. They are lazy: recorded, not executed.
- **Terminal operation**: triggers execution, consumes the stream, and produces a value (`toList`, `count`, `collect`), a side effect (`forEach`), or an `Optional` (`findFirst`, `max`).

A pipeline with no terminal operation runs nothing — a classic bug: `list.stream().map(this::save);` saves nothing.

## What a stream is not

A stream is **not a collection**: it stores no elements, it is computed on demand, and it can be consumed once. It is not a `List` with extra methods; it is a description of a computation over a source. `stream.toList()` produces a collection; the stream itself is gone afterwards.

```java
Stream<String> s = names.stream();
s.count();
s.count();          // IllegalStateException: stream has already been operated upon or closed
```

Make a new stream from the source for each use.

## Laziness, and why it matters

```java
Stream.of("a", "bb", "ccc")
    .filter(x -> { System.out.println("filter " + x); return x.length() > 1; })
    .map(x -> { System.out.println("map " + x); return x.toUpperCase(); })
    .findFirst();
// filter a / filter bb / map bb  — and stops: "ccc" is never examined
```

Elements flow through the pipeline **one at a time**, vertically, not stage by stage; and short-circuiting terminals (`findFirst`, `anyMatch`, `limit`) stop as soon as they can. This is what makes `Stream.iterate(1, x -> x * 2).limit(10)` — an infinite source — usable: only ten elements are ever produced.

Stateful intermediate ops (`sorted`, `distinct`) must see everything before emitting anything; `sorted()` on an infinite stream never returns.

## Sources

```java
list.stream(); set.stream(); map.entrySet().stream();
Arrays.stream(array); Arrays.stream(array, from, to);
Stream.of("a", "b"); Stream.empty(); Stream.ofNullable(maybeNull);
IntStream.range(0, 10); IntStream.rangeClosed(1, 10);
Stream.iterate(1, x -> x * 2);                 // infinite: 1, 2, 4, …
Stream.iterate(1, x -> x < 100, x -> x * 2);   // finite, Java 9: with a hasNext predicate
Stream.generate(Math::random);                 // infinite
"hello".chars();                               // IntStream of code units
Files.lines(path);                             // lazy lines — close it (try-with-resources)
new Random().ints(5, 0, 100);
```

## Intermediate versus terminal, at a glance

| Intermediate (lazy, return a stream) | Terminal (eager, end the stream) |
| --- | --- |
| `filter`, `map`, `flatMap`, `mapToInt/Obj` | `forEach`, `forEachOrdered` |
| `sorted`, `distinct` (stateful) | `collect`, `toList`, `toArray` |
| `limit`, `skip`, `takeWhile`, `dropWhile` | `reduce`, `count`, `sum`, `min`, `max`, `average` |
| `peek` (debugging) | `anyMatch`, `allMatch`, `noneMatch` (short-circuit) |
| `boxed`, `parallel`, `sequential`, `unordered` | `findFirst`, `findAny` (short-circuit) |

The next two lessons take each list in turn.

## Rules for the lambdas inside

1. **Stateless**: a lambda must not depend on state that changes during the pipeline. `map(x -> counter++ + x)` is wrong — with parallel streams it is *unpredictable*.
2. **Non-interfering**: never modify the source collection while the stream runs (`ConcurrentModificationException`, or undefined results).
3. **Side-effect free**, except in `forEach` and `peek`. Collecting into an external list from `map` or `filter` is the classic anti-pattern; use `collect`.

Streams are designed so the runtime may reorder, parallelise or skip work; lambdas that assume sequential order or accumulate outside the pipeline break that contract.

## Streams versus loops

```java
// loop
int total = 0;
for (Order o : orders) if (o.isPaid()) total += o.amount();
// stream
int total = orders.stream().filter(Order::isPaid).mapToInt(Order::amount).sum();
```

Use a stream when the computation is naturally *filter/map/reduce* and the pipeline reads as a sentence; use a loop for complex control flow, early exits with several conditions, mutation of several variables, or checked exceptions. Streams are not faster for small data (allocation and indirection cost more than the loop); they are clearer and compose better. In interviews, either is fine — say why you chose.

## Debugging a pipeline

`peek(System.out::println)` between stages prints each element as it passes — remember it runs lazily, only for elements the terminal pulls. Breaking a long pipeline into named intermediate streams or extracting lambdas into methods makes stack traces readable (`lambda$main$0` tells you little).

## Interview angle

- *"What is a stream?"* A lazy pipeline over a source with intermediate and terminal operations — not a data structure.
- *"Why lazy?"* Elements are processed one at a time and short-circuiting can stop early; infinite sources work.
- *"Can you reuse a stream?"* No — one terminal operation; then it is closed.
- *"Difference between intermediate and terminal?"* Intermediate returns a stream and does nothing until a terminal triggers execution.
- *"Should stream lambdas have side effects?"* No — stateless and non-interfering; side effects only in `forEach`.

## Key takeaways

- Source → lazy intermediates → one terminal. No terminal, no work; one terminal per stream.
- Elements flow one at a time; short-circuiting ops stop early; `sorted`/`distinct` need everything.
- Sources: collections, arrays, `Stream.of`, ranges, `iterate`/`generate`, `chars`, `Files.lines`.
- Lambdas must be stateless, non-interfering and side-effect free; collect results with terminals, not external lists.
