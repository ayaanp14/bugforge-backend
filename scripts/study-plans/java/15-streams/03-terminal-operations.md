---
title: Terminal operations — reduce, match, find, count
minutes: 14
---
A terminal operation is where the pipeline finally *does* something: it pulls elements through every lazy stage and produces a value, an `Optional`, a collection or a side effect. Choosing the right terminal is most of the skill — `reduce` when you fold to one value, `anyMatch` when a boolean is enough, `findFirst` when you want the first survivor and nothing more. This lesson covers every terminal except the collectors (next lesson), with the three forms of `reduce` explained properly, because `reduce` is where most stream code goes wrong.

## The whole list

| Group | Operations | Result |
| --- | --- | --- |
| Iterate | `forEach`, `forEachOrdered` | nothing (side effect) |
| Fold | `reduce` (3 forms), `count`, `sum`, `min`, `max`, `average` | value or `Optional` |
| Search | `findFirst`, `findAny` | `Optional<T>` |
| Test | `anyMatch`, `allMatch`, `noneMatch` | `boolean` |
| Materialise | `toList`, `toArray`, `collect`, `iterator` | collection / array |

Every one of them **consumes** the stream. Two terminals on the same stream is an `IllegalStateException`, not a second pass.

## `forEach` and `forEachOrdered`

```java
names.stream().forEach(System.out::println);
names.parallelStream().forEachOrdered(System.out::println);   // encounter order, even in parallel
```

`forEach` on a parallel stream makes no promise about order; `forEachOrdered` does, at the cost of the parallelism. On a plain `List`, `list.forEach(...)` is shorter than `list.stream().forEach(...)` and does the same thing. A `forEach` whose lambda fills an outside list is a `collect` in disguise — write the `collect`.

## `reduce` — folding to one value

The one-argument form takes an **accumulator** and returns an `Optional`, because an empty stream has nothing to fold:

```java
Optional<Integer> sum = Stream.of(1, 2, 3).reduce((a, b) -> a + b);      // Optional[6]
Optional<Integer> none = Stream.<Integer>empty().reduce(Integer::sum);     // Optional.empty
```

The two-argument form takes an **identity** and always returns a value:

```java
int sum = Stream.of(1, 2, 3).reduce(0, Integer::sum);                     // 6
int product = IntStream.rangeClosed(1, 5).reduce(1, (a, b) -> a * b);     // 120
String joined = Stream.of("a", "b", "c").reduce("", String::concat);       // "abc"
```

The identity must really be one: `identity op x == x` for every `x`. `0` for addition, `1` for multiplication, `""` for concatenation, `Integer.MIN_VALUE` for max. Pass `1` as the identity of a sum and the parallel version returns garbage — each chunk starts from 1 and the extras add up. That is not a theoretical bug; it is the standard "why does my parallel reduce give a different answer" question.

The three-argument form `reduce(identity, accumulator, combiner)` changes the result type: accumulate `T`s into a `U`, and combine two `U`s when chunks meet in parallel.

```java
int totalLength = words.stream().reduce(0, (len, w) -> len + w.length(), Integer::sum);
```

Sequentially the combiner is never called; it must still be correct, because `parallel()` is one method call away. If you find yourself reducing into a mutable container (a `StringBuilder`, an `ArrayList`), stop — that is what `collect` is for. `reduce` must not mutate; `collect` is built to.

## `count`, `min`, `max`, `sum`, `average`

```java
long n = words.stream().filter(w -> w.length() > 3).count();
Optional<String> shortest = words.stream().min(Comparator.comparingInt(String::length));
Optional<Person> oldest = people.stream().max(Comparator.comparingInt(Person::age));
int total = orders.stream().mapToInt(Order::amount).sum();                 // sum only on primitive streams
OptionalDouble mean = IntStream.of(3, 4, 5).average();
```

`min`/`max` on an object stream **need a comparator** and return `Optional`. `sum` and `average` exist only on `IntStream`/`LongStream`/`DoubleStream`; on `Stream<Integer>` write `mapToInt(Integer::intValue).sum()` or `reduce(0, Integer::sum)`. Since Java 9, `count()` may skip the pipeline entirely when the size is known from the source (`List.of(1,2,3).stream().peek(...).count()` prints nothing) — another reason not to rely on `peek` for side effects.

## `findFirst` and `findAny`

```java
Optional<String> first = words.stream().filter(w -> w.startsWith("q")).findFirst();
Optional<String> any = words.parallelStream().filter(w -> w.startsWith("q")).findAny();
```

Both short-circuit: as soon as one element survives the filters, the pipeline stops. `findFirst` respects encounter order, which in parallel means waiting to be sure nothing earlier qualifies; `findAny` takes whatever finishes first and is the faster parallel choice when any survivor will do. Sequentially they behave identically.

## `anyMatch`, `allMatch`, `noneMatch`

```java
boolean hasAdult   = people.stream().anyMatch(p -> p.age() >= 18);
boolean allAdults  = people.stream().allMatch(p -> p.age() >= 18);
boolean noMinors   = people.stream().noneMatch(p -> p.age() < 18);
```

All three short-circuit. Two edge cases are worth a second look: on an **empty stream**, `allMatch` is `true` and `anyMatch` is `false` (vacuous truth, exactly as in mathematics), and `allMatch(p) == noneMatch(p.negate())`. Use these instead of `filter(...).count() > 0`, which scans everything and reads worse.

## `toList`, `toArray`, `iterator`

```java
List<String> l1 = s.toList();                       // Java 16: unmodifiable, nulls allowed
List<String> l2 = s.collect(Collectors.toList());   // an ArrayList in practice, but unspecified
String[] a1 = s.toArray(String[]::new);             // typed array
Object[] a0 = s.toArray();                          // Object[] — usually not what you want
Iterator<String> it = s.iterator();                 // for the rare loop that needs a stream source
```

`Stream.toList()` returns a list you cannot add to; `Collectors.toList()` returns one you (currently) can. When the rest of the code mutates the result, say so with `collect(Collectors.toCollection(ArrayList::new))` — that is the only one that *guarantees* mutability.

## A worked example: three ways to the same answer

Longest word in a list, ties to the earliest:

```java
Optional<String> a = words.stream().max(Comparator.comparingInt(String::length));                 // ties → last? no: max keeps the first of equals
Optional<String> b = words.stream().reduce((x, y) -> y.length() > x.length() ? y : x);          // explicit tie rule
String c = words.stream().sorted(Comparator.comparingInt(String::length).reversed()).findFirst().orElse("");
```

`max` with `comparingInt` returns the **first** maximal element in encounter order (its implementation keeps the current best unless the new one is strictly greater), `b` spells that rule out, and `c` sorts everything just to take one — O(n log n) for an O(n) job. Prefer `a`; be able to explain why `c` is wasteful.

## Interview angle

- *"What does `reduce` return with one argument?"* An `Optional`, because the stream might be empty.
- *"What must be true of a `reduce` identity?"* `identity op x == x` for all `x`; a wrong identity gives wrong parallel results.
- *"`allMatch` on an empty stream?"* `true`; `anyMatch` is `false`.
- *"`findFirst` versus `findAny`?"* Same sequentially; `findAny` is faster in parallel because it need not respect encounter order.
- *"How do you sum a `Stream<Integer>`?"* `mapToInt(Integer::intValue).sum()` or `reduce(0, Integer::sum)`; `sum()` lives on the primitive streams.

## Key takeaways

- One terminal per stream; it pulls everything through the lazy stages.
- `reduce`: one argument → `Optional`; two → identity + accumulator; three → change the type with a combiner. Identity must be a real identity; never mutate inside `reduce`.
- `min`/`max` need a comparator on object streams; `sum`/`average` live on primitive streams.
- `find*` and `*Match` short-circuit; `allMatch` of nothing is `true`.
- `toList()` is unmodifiable; `Collectors.toCollection(ArrayList::new)` when you need to mutate.
