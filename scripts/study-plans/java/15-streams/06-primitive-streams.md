---
title: Primitive streams — IntStream, LongStream, DoubleStream
minutes: 12
---
A `Stream<Integer>` boxes every element: each `int` becomes an object on the heap, every arithmetic step unboxes and re-boxes, and `sum()` does not even exist on it. The three primitive specialisations — `IntStream`, `LongStream`, `DoubleStream` — fix that. They carry `int`s, `long`s and `double`s directly, add the numeric terminals (`sum`, `average`, `summaryStatistics`), and make the range loop `for (int i = 0; i < n; i++)` expressible as a pipeline. This lesson covers them, the conversions between the worlds, and the two places (`chars()` and `range`) where they show up whether you asked or not.

## Sources

```java
IntStream.range(0, 5);           // 0 1 2 3 4
IntStream.rangeClosed(1, 5);     // 1 2 3 4 5
IntStream.of(3, 1, 4);
IntStream.iterate(1, x -> x * 2).limit(10);          // powers of two
IntStream.iterate(1, x -> x <= 1000, x -> x * 2);    // finite (Java 9)
IntStream.generate(() -> 7).limit(3);
Arrays.stream(new int[]{1, 2, 3});                   // int[] → IntStream (an Integer[] would give Stream<Integer>)
"hello".chars();                                      // IntStream of UTF-16 code units
"hello".codePoints();                                 // IntStream of code points — safe for emoji
new Random().ints(5, 0, 100);                         // five ints in [0, 100)
LongStream.rangeClosed(1, 20);                        // for factorials: long, not int
```

There is no `range` for `DoubleStream`; build one with `IntStream.range(...).mapToDouble(i -> i * 0.1)`.

## Numeric terminals — the reason they exist

```java
int sum = IntStream.rangeClosed(1, 100).sum();                 // 5050
OptionalInt max = IntStream.of(3, 9, 2).max();                 // OptionalInt[9] — no comparator needed
OptionalDouble avg = IntStream.of(1, 2, 4).average();           // 2.333…
long count = IntStream.range(0, 10).filter(i -> i % 3 == 0).count();

IntSummaryStatistics st = IntStream.of(4, 8, 15, 16, 23, 42).summaryStatistics();
st.getCount(); st.getSum(); st.getMin(); st.getMax(); st.getAverage();   // all five in one pass
```

`max`/`min` need no comparator (the natural order of numbers is built in); `average` returns `OptionalDouble` (empty for no elements); `sum` of an empty stream is `0`. **Overflow is silent**: `IntStream.rangeClosed(1, 20).reduce(1, (a, b) -> a * b)` wraps around — use `LongStream` or `asLongStream()` before multiplying, and `Math.multiplyExact` if you would rather fail than be wrong.

## Moving between the worlds

| From → to | Method |
| --- | --- |
| `Stream<T>` → `IntStream` | `mapToInt(ToIntFunction)` — `mapToInt(String::length)` |
| `IntStream` → `Stream<Integer>` | `boxed()` |
| `IntStream` → `Stream<R>` | `mapToObj(IntFunction)` — `mapToObj(i -> "#" + i)` |
| `IntStream` → `LongStream` / `DoubleStream` | `asLongStream()`, `asDoubleStream()`, or `mapToLong`/`mapToDouble` |
| `Stream<Integer>` → `int[]` | `mapToInt(Integer::intValue).toArray()` |
| `IntStream` → `List<Integer>` | `boxed().toList()` |

`IntStream.toArray()` gives an `int[]`; `Stream<Integer>.toArray()` gives an `Object[]` — a favourite source of surprise. Collectors work only on object streams: `boxed()` before `collect(groupingBy(...))`.

## Working with characters

```java
long vowels = s.chars().filter(c -> "aeiou".indexOf(c) >= 0).count();
String upper = s.chars().mapToObj(c -> String.valueOf((char) Character.toUpperCase(c))).collect(joining());
boolean allDigits = !s.isEmpty() && s.chars().allMatch(Character::isDigit);
Map<Character, Long> freq = s.chars().mapToObj(c -> (char) c).collect(groupingBy(c -> c, TreeMap::new, counting()));
String reversed = new StringBuilder(s).reverse().toString();   // not a stream job — know when to stop
```

`chars()` yields `int`s, so the `char` cast is on you; `mapToObj(c -> (char) c)` gets you a `Stream<Character>` for collectors. For text that may contain characters outside the basic plane (emoji, some CJK), `codePoints()` and `Character.toChars` are the correct pair.

## Index-driven pipelines

Streams have no index. When you need one, generate it:

```java
IntStream.range(0, list.size()).filter(i -> i % 2 == 0).mapToObj(list::get).toList();   // even positions
IntStream.range(0, a.length).mapToObj(i -> a[i] + "@" + i).forEach(System.out::println);
IntStream.range(0, n).map(i -> n - 1 - i);                                             // count down
```

If the loop body needs *two* indices or mutates as it goes, the `for` loop is the right tool; a stream contorted around an index is worse than the loop it replaced.

## Boxing costs, measured honestly

On a million integers, `Stream<Integer>` summing via `reduce(0, Integer::sum)` allocates a million `Integer`s (well, most of them — the small ones come from the cache) and runs several times slower than `IntStream.sum()`. It rarely matters at interview scale; it always matters in a hot loop over an `int[]`. The habit is cheap: reach for `mapToInt` the moment the pipeline turns numeric, and stay unboxed until a collector needs objects.

## Interview angle

- *"Why do primitive streams exist?"* To avoid boxing and to provide `sum`/`average`/`summaryStatistics`, which `Stream<Integer>` lacks.
- *"`Arrays.stream(int[])` returns…?"* `IntStream`; `Arrays.stream(Integer[])` returns `Stream<Integer>`.
- *"How do you get from `IntStream` to a `List<Integer>`?"* `boxed().toList()` (or `collect(toList())`).
- *"What does `String.chars()` return?"* An `IntStream` of UTF-16 code units — cast to `char`, or use `codePoints()` for supplementary characters.
- *"What does `average()` return on an empty stream?"* `OptionalDouble.empty()`; `sum()` returns `0`.

## Key takeaways

- `IntStream`/`LongStream`/`DoubleStream` hold primitives: no boxing, numeric terminals built in.
- `range`/`rangeClosed` replace index loops; `iterate` with a predicate for other progressions.
- Convert with `mapToInt`, `boxed`, `mapToObj`, `asLongStream`; collectors need objects.
- `sum` of nothing is 0; `average`/`max`/`min` return the `Optional*` types; overflow is silent — go `long` early.
- `chars()` is an `IntStream`; cast to `char` or use `codePoints()`.
