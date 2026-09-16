---
title: Functions as values — composition, factories and strategies
minutes: 13
---
Once behaviour can be stored in a variable, passed to a method and returned from one, a set of techniques opens up that have no equivalent in purely object-oriented code: functions that build functions, pipelines assembled from small pieces, strategies chosen at run time from a map, and callbacks. This lesson is a tour of those techniques as they appear in everyday Java — nothing academic, all of it in real codebases.

## Higher-order methods

A method that takes or returns a function:

```java
static <T> List<T> filter(List<T> xs, Predicate<T> keep) {
    List<T> out = new ArrayList<>();
    for (T x : xs) if (keep.test(x)) out.add(x);
    return out;
}
static <T, R> List<R> map(List<T> xs, Function<T, R> f) { … }
static <T> void retry(int times, Supplier<T> action) { … }
static <T> T withTiming(String label, Supplier<T> action) {
    long t0 = System.nanoTime();
    try { return action.get(); }
    finally { System.out.println(label + ": " + (System.nanoTime() - t0) / 1_000_000 + " ms"); }
}

List<String> longNames = filter(names, n -> n.length() > 5);
Config c = withTiming("load", () -> loadConfig(path));
```

The "wrap an action" shape — timing, retrying, logging, running under a lock, in a transaction — is where `Supplier`/`Runnable` parameters shine: the wrapper owns the setup and teardown, the caller supplies the middle.

## Functions that return functions (factories and currying)

```java
static Predicate<String> startsWith(String prefix) {
    return s -> s.startsWith(prefix);              // the returned lambda captures prefix
}
static Function<Integer, Integer> adder(int n) {
    return x -> x + n;
}
static Comparator<Person> byField(String field) {
    return switch (field) {
        case "age" -> Comparator.comparingInt(Person::age);
        case "name" -> Comparator.comparing(Person::name);
        default -> throw new IllegalArgumentException(field);
    };
}

Predicate<String> isTemp = startsWith("tmp_");
Function<Integer, Integer> plus10 = adder(10);
```

A method returning a lambda that captured its arguments is a **closure factory**. `adder(10)` is partial application; a function returning a function of one argument at a time is currying (`x -> y -> x + y`, type `Function<Integer, Function<Integer, Integer>>`) — rare in Java, but you should recognise it.

## Composition

```java
Function<String, String> trim = String::trim;
Function<String, String> lower = String::toLowerCase;
Function<String, String> normalise = trim.andThen(lower);            // trim first, then lower
Function<String, Integer> normalisedLength = normalise.andThen(String::length);

Predicate<String> notBlank = Predicate.not(String::isBlank);
Predicate<String> valid = notBlank.and(s -> s.length() < 100).or(s -> s.equals("*"));

Comparator<Person> order = Comparator.comparing(Person::lastName)
    .thenComparing(Person::firstName)
    .thenComparingInt(Person::age)
    .reversed();

UnaryOperator<String> pipeline = List.<UnaryOperator<String>>of(String::trim, String::toLowerCase, s -> s.replace(' ', '_'))
    .stream().reduce(UnaryOperator.identity(), (f, g) -> s -> g.apply(f.apply(s)));   // fold a list of steps into one function
```

`andThen`/`compose` for functions, `and`/`or`/`negate` for predicates, `thenComparing`/`reversed` for comparators — the default methods on the functional interfaces are the composition vocabulary. Small named pieces composed at the use site read better than one large lambda.

## The strategy pattern, with lambdas

```java
Map<String, BinaryOperator<Long>> ops = Map.of(
    "+", Long::sum,
    "-", (a, b) -> a - b,
    "*", (a, b) -> a * b,
    "max", Math::max
);
long result = ops.getOrDefault(symbol, (a, b) -> { throw new IllegalArgumentException(symbol); }).apply(x, y);
```

Where Java 5 code declared an interface, four classes and a factory, a map of lambdas does the same in six lines. The interface still exists (`BinaryOperator`), the strategies are still swappable and testable — they are just not classes. Reach for named classes again when a strategy has state or configuration of its own.

## Callbacks and event handling

```java
button.onClick(e -> save());
executor.submit(() -> process(job));
CompletableFuture.supplyAsync(this::fetch).thenApply(this::parse).thenAccept(this::render);
list.removeIf(item -> item.isExpired());
map.computeIfAbsent(key, k -> new ArrayList<>()).add(value);
map.merge(word, 1, Integer::sum);
```

Every "call me when" API takes a functional interface. The collection APIs' `removeIf`, `replaceAll`, `computeIfAbsent`, `merge`, `forEach` are lambdas replacing loops that used to be five lines with an iterator.

## Lazy evaluation with `Supplier`

```java
void log(Level level, Supplier<String> message) {
    if (isEnabled(level)) System.out.println(message.get());     // the string is built only if needed
}
log(DEBUG, () -> "state=" + expensiveDump());

T orElseGet(Supplier<? extends T> other)     // Optional: computed only when empty
```

Passing a `Supplier` instead of a value defers the work until the callee decides it is needed — the difference between `orElse(computeDefault())` (always computes) and `orElseGet(this::computeDefault)` (computes on demand).

## Exceptions in functional code

Functional interfaces in `java.util.function` declare no checked exceptions. Options when the body throws one:

1. Catch inside the lambda and handle or wrap: `s -> { try { return parse(s); } catch (IOException e) { throw new UncheckedIOException(e); } }`.
2. Write a small helper interface `ThrowingFunction<T, R, E extends Exception>` and an adapter that wraps to unchecked.
3. Restructure so the throwing call happens outside the lambda.

The first is the everyday answer; Module 12 covers the exception side.

## Keeping it readable

- Name intermediate functions (`Predicate<String> valid = …`) instead of nesting lambdas three deep.
- Prefer the standard interfaces so callers recognise the shapes.
- Do not build a function pipeline when a plain method with three statements is clearer — functional style is a tool, not a goal.
- Side-effect-free lambdas compose and test easily; lambdas that mutate shared state do not.

## Interview angle

- *"What is a higher-order function?"* One that takes or returns a function — `filter(list, predicate)`, `Comparator.comparing`.
- *"What is a closure in Java?"* A lambda that captures variables from its enclosing scope; `adder(10)` returns one.
- *"How would you implement the strategy pattern today?"* A functional interface and lambdas (or a map of them), classes only for stateful strategies.
- *"Why `orElseGet` over `orElse`?"* The supplier is evaluated only when needed.

## Key takeaways

- Methods can take functions (`filter`, `withTiming`) and return them (`startsWith(prefix)`, `adder(n)`) — closures capture their arguments.
- Compose with `andThen`/`compose`, `and`/`or`/`negate`, `thenComparing`/`reversed`.
- Strategies, callbacks and collection operations (`removeIf`, `computeIfAbsent`, `merge`) are lambdas now.
- `Supplier` defers work; checked exceptions inside lambdas must be caught or wrapped.
