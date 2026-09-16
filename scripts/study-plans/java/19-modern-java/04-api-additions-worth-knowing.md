---
title: The API additions worth knowing, 9 to 21
minutes: 14
---
Language features get the headlines; the library additions save you more lines per day. Since Java 9 the standard library has gained immutable collection factories, a dozen `String` methods, a modern HTTP client, `Stream.toList()`, `Collectors.teeing`, helpful `NullPointerException` messages and, in 21, the sequenced collections that finally give `List` a `getLast()`. This lesson is the tour of the ones you will use weekly, grouped by what they replace, with the version each arrived in so you know what your target JDK has.

## Collection factories (9) and copies (10)

```java
List<String> names = List.of("ann", "bob");        // immutable; nulls rejected with NPE
Set<Integer> primes = Set.of(2, 3, 5);              // immutable; duplicates throw IllegalArgumentException
Map<String, Integer> ages = Map.of("ann", 30, "bob", 25);          // up to 10 pairs
Map<String, Integer> big = Map.ofEntries(Map.entry("a", 1), Map.entry("b", 2));
List<String> frozen = List.copyOf(mutableList);     // immutable snapshot; returns the same instance if already immutable
```

They replace `Arrays.asList` (fixed-size but *mutable* via `set`, and backed by the array) and `Collections.unmodifiableList` (a live *view* — the underlying list can still change). The factories are truly immutable, compact (a two-element list is one small object), and **null-hostile**. Any mutator throws `UnsupportedOperationException`. `Set.of` and `Map.of` iterate in an order that is randomised per JVM run on purpose, so nobody comes to depend on it.

## Strings (11, 12, 13, 15)

```java
"  x ".strip();  " x".stripLeading();  "x ".stripTrailing();    // Unicode-aware, unlike trim()
"   ".isBlank();                                                  // true — whitespace-only
"a\nb\r\nc".lines();                                              // Stream<String>, any line terminator
"ab".repeat(3);                                                   // "ababab"
"line".indent(4);                                                 // 12: "    line\n" — adds a newline
"hello".transform(String::toUpperCase);                            // 12: apply a function, for chaining
"""
  a
    b
  """.stripIndent();                                              // 13: remove common leading whitespace
"%s has %d".formatted("ann", 3);                                  // 15: String.format as an instance method
"héllo".chars(); "😀".codePoints();                               // 9: codePoints() on CharSequence
```

`strip` versus `trim`: `trim` removes characters ≤ `U+0020`; `strip` uses `Character.isWhitespace`, so it also removes Unicode spaces like `U+2003`. `lines()` plus `strip` plus `isBlank` is the modern way to clean text input; `repeat` retires the `StringBuilder` loop for padding.

## Streams and collectors (9, 12, 16)

```java
Stream.iterate(1, x -> x < 100, x -> x * 2);       // 9: finite iterate
stream.takeWhile(p); stream.dropWhile(p);           // 9
Stream.ofNullable(maybeNull);                       // 9: 0 or 1 elements
Collectors.filtering(p, downstream); Collectors.flatMapping(f, downstream);   // 9
Collectors.teeing(c1, c2, merger);                  // 12
stream.toList();                                    // 16: unmodifiable, shorter than collect(toList())
stream.mapMulti((x, sink) -> { if (…) sink.accept(…); });   // 16: an imperative flatMap
Predicate.not(String::isBlank);                     // 11: readable negation of a method reference
```

## `Optional` (9, 10, 11)

`ifPresentOrElse(action, emptyAction)`, `or(supplier)` and `stream()` in 9; `orElseThrow()` with no arguments in 10 (the honest replacement for `get()`); `isEmpty()` in 11. Covered in the streams module — mentioned here so you know which JDK has them.

## `Objects` and helpful NPEs (9, 14)

```java
String name = Objects.requireNonNullElse(input, "anonymous");        // 9
int len = Objects.requireNonNullElseGet(list, ArrayList::new).size(); // 9
Objects.checkIndex(i, size);                                          // 9: throws IndexOutOfBoundsException with a message
```

Java 14's **helpful `NullPointerException`** (on by default since 15) says *what* was null: `Cannot invoke "String.length()" because the return value of "Person.name()" is null` — instead of a bare line number. It makes the most common exception in Java self-explanatory; when a local is involved the message names it if the class was compiled with `-g`, otherwise `<local4>`.

## `HttpClient` (11)

```java
HttpClient client = HttpClient.newHttpClient();
HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.example.com/v1/items"))
    .header("Accept", "application/json").timeout(Duration.ofSeconds(5)).GET().build();
HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());          // blocking
CompletableFuture<HttpResponse<String>> async = client.sendAsync(req, BodyHandlers.ofString());  // non-blocking
```

HTTP/2, WebSockets, asynchronous via `CompletableFuture`, immutable request objects, a builder API — everything `HttpURLConnection` was not. For most services it removes the need for a third-party client.

## Files, time and misc (9, 11, 16, 18)

`Files.readString`/`writeString` (11), `Files.mismatch` (12); `Path.of` (11); `InputStream.readAllBytes` (9) and `transferTo` (9) — `in.transferTo(out)` is the copy loop you never write again; `Duration.toSeconds`/`toDaysPart` (9); `Math.floorMod` overloads; `Random`'s `RandomGenerator` interface with better algorithms (17: `RandomGenerator.of("L64X128MixRandom")`); `Thread.onSpinWait` (9); `Process.pid()` and `ProcessHandle` (9); the built-in `jwebserver` static file server (18); `System.Logger` (9) as a facade over whatever logging framework is present.

## Java 21: sequenced collections and friends

```java
SequencedCollection<E>: getFirst(), getLast(), addFirst(e), addLast(e), removeFirst(), removeLast(), reversed()
list.getLast();                    // instead of list.get(list.size() - 1)
list.reversed();                   // a live reversed VIEW, not a copy
new LinkedHashSet<>(…).getFirst(); // insertion-ordered sets finally expose their ends
sortedMap.firstEntry(); linkedHashMap.pollLastEntry();  // SequencedMap
```

`List`, `Deque`, `LinkedHashSet`, `SortedSet`, `LinkedHashMap` and `SortedMap` all gained these; `getLast()` on an empty collection throws `NoSuchElementException`. Also in 21: `StringBuilder.repeat`, `Math.clamp`, `String.indexOf(ch, from, to)`, `Character.isEmoji`, and the `HexFormat` class (17) for the hex dumps you wrote by hand last module.

## Interview angle

- *"`List.of` versus `Arrays.asList` versus `Collections.unmodifiableList`?"* Immutable & null-hostile; fixed-size mutable view over the array; live read-only view over a list that can still change underneath.
- *"`strip` versus `trim`?"* `strip` is Unicode-aware (`Character.isWhitespace`); `trim` removes ≤ `U+0020` only.
- *"What is a helpful NPE?"* The Java 14+ message describing exactly which expression was null.
- *"How would you call an HTTP API in plain Java?"* `java.net.http.HttpClient` (11) — sync `send` or async `sendAsync`, HTTP/2.
- *"What did Java 21 add to `List`?"* `getFirst`, `getLast`, `addFirst`, `addLast`, `removeFirst`, `removeLast`, `reversed()` via `SequencedCollection`.

## Key takeaways

- `List.of`/`Set.of`/`Map.of`/`copyOf`: immutable, null-hostile, compact; mutators throw.
- Strings: `strip`, `isBlank`, `lines`, `repeat`, `indent`, `transform`, `stripIndent`, `formatted`.
- Streams: `toList`, `takeWhile`/`dropWhile`, finite `iterate`, `teeing`, `mapMulti`, `Predicate.not`.
- `Objects.requireNonNullElse`; helpful NPE messages; `HttpClient`; `transferTo`; `readString`/`writeString`.
- 21: sequenced collections (`getFirst`/`getLast`/`reversed`), `Math.clamp`, `HexFormat` (17).
