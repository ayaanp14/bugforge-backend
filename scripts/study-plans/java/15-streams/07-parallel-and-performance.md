---
title: Parallel streams, ordering and performance
minutes: 13
---
`.parallel()` is one method call that splits a pipeline across every core in the machine. It is also the easiest way in Java to make a correct program wrong, or a fast program slower, so it deserves a lesson of its own: how the work is split, what the pipeline must promise in return, when it actually pays, and how streams compare to loops when the clock is running.

## How a parallel stream runs

```java
long evens = IntStream.range(0, 10_000_000).parallel().filter(i -> i % 2 == 0).count();
```

The source is split with a `Spliterator` into chunks; the chunks are processed as tasks on the **common `ForkJoinPool`** (size = cores − 1, plus the calling thread); partial results are merged with the combiner. Every core busy, one line of code. `parallelStream()` on a collection and `parallel()` on a stream do the same thing; `sequential()` switches back — the *last* call wins for the whole pipeline.

Splitting quality depends on the source. `ArrayList`, arrays and `IntStream.range` split perfectly (known size, random access). `HashSet` and `TreeMap` split adequately. `LinkedList`, `Stream.iterate` and `BufferedReader.lines()` split badly — the spliterator has to walk to find the middle — and often run *slower* in parallel.

## What the pipeline must promise

Parallel execution is only correct when the lambdas keep the rules from the first lesson, and two more:

1. **No shared mutable state.** `list.parallelStream().forEach(x -> results.add(x))` corrupts the `ArrayList` — lost elements, `ArrayIndexOutOfBoundsException`, or silent garbage. Use `collect`, whose combiner exists for exactly this.
2. **`reduce` identity and associativity.** The identity must be a real identity and the operation associative (`(a op b) op c == a op (b op c)`); subtraction and string prefixing are not, and the parallel answer differs run to run.
3. **Stateless lambdas.** A counter captured from outside, a `Random` shared between threads, a `SimpleDateFormat` — all break.
4. **No blocking.** The common pool is shared by every parallel stream *and* `CompletableFuture` in the JVM. A lambda that waits on I/O parks a pool thread and starves everyone else; parallel streams are for CPU work.

## Ordering

A stream from a `List` has an **encounter order**, and most operations respect it even in parallel: `toList`, `forEachOrdered`, `findFirst`, `limit`, `skip`, `sorted`. Respecting order costs — `limit(10)` in parallel must buffer to be sure it kept the *first* ten. Three ways to pay less:

```java
list.parallelStream().forEach(...)                         // no order promised — usually what you wanted from forEach anyway
list.parallelStream().unordered().distinct()                // distinct without preserving first-seen order: much cheaper
list.parallelStream().findAny()                             // any survivor, not the first
```

A `HashSet` source has no encounter order to begin with, so ordering is free (and meaningless) there.

## When parallel actually helps

The rule of thumb from the JDK's own authors: `N × Q > 10 000`, where `N` is the element count and `Q` the cost per element in "simple operations". Ten million cheap integers, or ten thousand expensive image transforms, might benefit; a hundred strings never will. Even then:

- The work must be **CPU-bound** and **independent** per element.
- The source must **split well** (array, `ArrayList`, range).
- The machine must have **idle cores** — on a busy server the pool is already saturated.
- The terminal must **merge cheaply** — `count`, `sum`, `toList` do; `groupingBy` into a `HashMap` merges maps and can cost more than it saved (`groupingByConcurrent` helps when order does not matter).

Measure before and after. If you cannot measure it, do not parallelise it.

## Streams versus loops: performance, not just taste

For small collections a stream costs more than the loop: the pipeline objects, the lambdas, the iterator, and a cold JIT. On a million-element `int[]`, `IntStream.sum()` and a `for` loop are within noise once warmed up — the JIT inlines the lambdas — while `Stream<Integer>` with boxing is several times slower. The rules that follow:

- **Boxing** is the main cost, not the stream. `mapToInt` early.
- `sorted()` is O(n log n) and buffers everything; sorting to take one element is the classic waste — `min`/`max` instead.
- `distinct()` builds a `HashSet`; on a sorted source, hand-written adjacent-duplicate removal is cheaper.
- Multiple passes over the same source (`count()` then `sum()` then `max()`) are three iterations; `summaryStatistics()` or `teeing` is one.
- In interviews the difference rarely matters; the ability to *explain* it does. "A stream here is the same complexity; I would switch to a loop if profiling showed the pipeline overhead" is the right sentence.

## Debugging and safety checklist

Before shipping `.parallel()`:

- Every lambda stateless and side-effect free? Results collected with `collect`, not an outside list?
- `reduce` with a true identity and an associative operation?
- Nothing blocking (no I/O, no locks, no `Thread.sleep`) inside the pipeline?
- Source splits well? Enough elements and per-element work to matter?
- Measured, on data of production size, with the JIT warmed?

If any answer is "not sure", stay sequential. A sequential stream is never the bug.

## Interview angle

- *"How does a parallel stream execute?"* Spliterator chunks the source; the common `ForkJoinPool` runs the chunks; combiners merge.
- *"When does `parallel()` make code slower?"* Small data, cheap operations, badly-splitting sources (`LinkedList`, `iterate`), order-preserving operations, expensive merges, blocking lambdas.
- *"What goes wrong with `forEach(list::add)` in parallel?"* A race on an unsynchronised `ArrayList`; use `collect`.
- *"Why must a `reduce` be associative?"* Chunks are combined in an unpredictable tree; only associativity guarantees the same result.
- *"Which pool runs parallel streams?"* The common `ForkJoinPool`, shared JVM-wide — a blocking lambda starves other users.

## Key takeaways

- `parallel()` splits the source and runs on the common ForkJoinPool; the last `parallel`/`sequential` call wins.
- Correctness needs stateless, non-interfering, side-effect-free lambdas and associative reductions with true identities; collect instead of mutating.
- Order costs: `unordered()`, `findAny`, plain `forEach` when order does not matter.
- Helps only for large, CPU-bound, well-splitting work on idle cores — and only if you measured.
- Boxing, `sorted` and repeated passes are the real stream costs; the loop is the fallback, not the enemy.
