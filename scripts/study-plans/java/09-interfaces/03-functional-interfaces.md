---
title: Functional interfaces and the shape of a lambda
minutes: 13
---
A **functional interface** is an interface with exactly one abstract method. That single method is what a lambda expression or a method reference *implements* — every lambda in Java has a functional interface as its type. Understanding this link is what makes lambdas, streams and most modern Java APIs readable rather than magical. This lesson is the interface side; Module 11 covers the lambda syntax and captures in full.

## One abstract method

```java
@FunctionalInterface
public interface Validator<T> {
    boolean isValid(T value);                      // the single abstract method (SAM)

    default Validator<T> and(Validator<T> other) {  // defaults do not count
        return v -> isValid(v) && other.isValid(v);
    }
    static <T> Validator<T> notNull() { return v -> v != null; }   // statics do not count
}
```

Default and static methods do not count toward the "one"; nor do abstract redeclarations of `Object`'s public methods (`Comparator` declares `boolean equals(Object)` and is still functional). `@FunctionalInterface` is optional but recommended: it makes adding a second abstract method a compile error, protecting every lambda that implements the interface.

## Lambdas implement the SAM

```java
Validator<String> nonEmpty = s -> !s.isEmpty();            // a lambda: an instance of Validator<String>
Validator<String> shortish = s -> s.length() < 10;
Validator<String> both = nonEmpty.and(shortish);
both.isValid("hello");                                     // true
```

The compiler looks at the target type (`Validator<String>`), finds its single abstract method (`boolean isValid(String)`), checks that the lambda's parameter count and body fit, and creates an object implementing the interface. The lambda *is* the implementation of `isValid`. Nothing else in the language is happening — no special "function type".

Before Java 8 the same thing was an **anonymous class**:

```java
Validator<String> nonEmpty = new Validator<String>() {
    @Override public boolean isValid(String s) { return !s.isEmpty(); }
};
```

Lambdas are shorter, do not create a class file per use, and treat `this` differently (Module 11). Anonymous classes remain necessary for interfaces with more than one abstract method and for abstract classes.

## The `java.util.function` toolkit

Java ships a family of general-purpose functional interfaces so you rarely write your own:

| Interface | Method | Meaning |
| --- | --- | --- |
| `Supplier<T>` | `T get()` | produce a value |
| `Consumer<T>` | `void accept(T t)` | use a value |
| `Function<T, R>` | `R apply(T t)` | transform |
| `Predicate<T>` | `boolean test(T t)` | test |
| `UnaryOperator<T>` | `T apply(T t)` | `Function<T, T>` |
| `BiFunction<T, U, R>` | `R apply(T t, U u)` | two inputs |
| `BinaryOperator<T>` | `T apply(T a, T b)` | `BiFunction<T, T, T>` — reduce steps |
| `BiConsumer<T, U>`, `BiPredicate<T, U>` | | two-argument forms |
| `Runnable` | `void run()` | no input, no output |
| `Callable<V>` | `V call() throws Exception` | no input, a result, may throw |
| `Comparator<T>` | `int compare(T a, T b)` | ordering |

Primitive specialisations avoid boxing: `IntPredicate`, `IntFunction<R>`, `ToIntFunction<T>`, `IntUnaryOperator`, `IntBinaryOperator`, `DoubleSupplier`, `LongConsumer`, and so on. Streams use them heavily (`mapToInt`, `IntStream.map`).

Choosing: count the inputs and whether there is an output. One in, boolean out → `Predicate`. One in, one out → `Function`. Nothing in, one out → `Supplier`. One in, nothing out → `Consumer`. Two in, one out → `BiFunction` (or `BinaryOperator` when all three types match).

## Composition with default methods

The toolkit interfaces carry defaults that build new functions from old:

```java
Predicate<String> isEmpty = String::isEmpty;
Predicate<String> notEmpty = isEmpty.negate();             // or Predicate.not(String::isEmpty)
Predicate<String> shortNonEmpty = notEmpty.and(s -> s.length() < 5);

Function<Integer, Integer> twice = x -> x * 2;
Function<Integer, Integer> plusOne = x -> x + 1;
twice.andThen(plusOne).apply(5);        // 11: (5*2)+1
twice.compose(plusOne).apply(5);        // 12: (5+1)*2

Comparator<String> byLength = Comparator.comparing(String::length);
Comparator<String> byLengthThenAlpha = byLength.thenComparing(Comparator.naturalOrder());
```

`Comparator` is the richest: `comparing`, `comparingInt`, `thenComparing`, `reversed`, `nullsFirst`, `naturalOrder` — Module 14 uses all of them.

## Writing your own

Prefer the standard interfaces; a custom one earns its place when the name carries meaning (`Validator`, `EventHandler`, `RetryPolicy`), when it needs a checked exception (`Callable`-like), or when it needs more than two parameters. Keep it to one abstract method, annotate it, and add composing defaults if they read naturally.

## Method references

A method reference is a lambda that just calls one method: `String::isEmpty` for `s -> s.isEmpty()`, `Integer::parseInt` for `s -> Integer.parseInt(s)`, `System.out::println` for `x -> System.out.println(x)`, `ArrayList::new` for `() -> new ArrayList<>()`. Four kinds, all in Module 11; here the point is that they too need a functional-interface target type.

## Functional interfaces and generics

`Function<T, R>` is generic in both directions; the compiler infers `T` and `R` from context — `map(String::length)` on a `Stream<String>` infers `Function<String, Integer>`. When inference fails ("cannot infer type arguments"), give the lambda's parameter a type: `(String s) -> s.length()`, or assign to a typed variable first.

## Interview angle

- *"What is a functional interface?"* One abstract method; the target type of lambdas and method references.
- *"Does a default method break it?"* No — only abstract methods count.
- *"What is `@FunctionalInterface` for?"* A compile-time guarantee that the interface stays lambda-compatible.
- *"Name four from `java.util.function`."* `Supplier`, `Consumer`, `Function`, `Predicate` (and `BiFunction`, `UnaryOperator`).
- *"`Runnable` vs `Callable`?"* `Callable` returns a value and may throw checked exceptions.

## Key takeaways

- One abstract method = functional interface = a lambda's type; `@FunctionalInterface` enforces it.
- `Supplier`/`Consumer`/`Function`/`Predicate` and their Bi-/primitive forms cover most needs; pick by arity and output.
- Defaults compose: `and`, `or`, `negate`, `andThen`, `compose`, `thenComparing`, `reversed`.
- Write a custom one for a meaningful name, a checked exception, or three-plus parameters.
