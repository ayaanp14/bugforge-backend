---
title: Varargs — methods that take any number of arguments
minutes: 10
---
`String.format("%d %s", 3, "x")` takes two extra arguments; `Arrays.asList(1, 2, 3)` takes three; `Math.max` takes exactly two. The first two use **varargs** — a parameter declared with `...` that accepts zero or more values and arrives as an array. This lesson covers the syntax, the rules, the interaction with overloading, and the two pitfalls (`null` and generics) that produce warnings and bugs.

## Syntax

```java
static int sum(int... numbers) {          // numbers is an int[] inside
    int total = 0;
    for (int n : numbers) total += n;
    return total;
}

sum();               // 0     — an empty array
sum(1);              // 1
sum(1, 2, 3);        // 6
sum(new int[] {4, 5});   // 9  — an explicit array is also accepted
```

Inside the method a varargs parameter **is** an array: `numbers.length`, `numbers[i]`, for-each. The compiler packs the call's trailing arguments into a new array at each call site — `sum(1, 2, 3)` compiles to `sum(new int[] {1, 2, 3})`.

Rules:

- Only the **last** parameter may be varargs: `static void log(String level, Object... details)`.
- At most one per method.
- `T...` is equivalent to `T[]` in the signature — `sum(int...)` and `sum(int[])` are the *same* method and cannot both be declared.
- The main method may be `public static void main(String... args)`.

## Common uses

```java
System.out.printf("%s is %d%n", name, age);          // Object... after the format
Arrays.asList("a", "b", "c");                          // T...
List.of(1, 2, 3);                                      // overloads up to 10 args, then E...
EnumSet.of(Day.MON, Day.TUE);
Collections.addAll(list, "x", "y", "z");
Path.of("home", "user", "file.txt");                   // String first, String... more
static <T> T firstNonNull(T... values)
```

They shine for "one or more of the same thing" APIs where forcing the caller to build an array would be noise.

## Varargs and overload resolution

Varargs applicability is the **third and last phase** of overload resolution (previous lesson): a fixed-arity overload that fits, with or without boxing, always wins.

```java
static void f(int a, int b)   { System.out.println("two"); }
static void f(int... a)       { System.out.println("varargs"); }

f(1, 2);      // "two"
f(1, 2, 3);   // "varargs"
f();          // "varargs"
```

Mixing a fixed overload and a varargs overload of the same type is a common and sensible pattern (`List.of` does it for performance: fixed-arity overloads avoid allocating an array for the common small cases).

## Pitfall 1: passing `null`

```java
static void print(String... items) { System.out.println(items.length); }

print();              // 0
print((String) null); // 1 — an array holding one null
print(null);          // NullPointerException: null is passed AS the array; items is null
```

A bare `null` matches the array type directly, so the parameter *is* null. Cast it (`(String) null`) to mean "one null element", and inside varargs methods consider guarding `if (items == null)`.

## Pitfall 2: a single array argument

```java
static void show(Object... items) { System.out.println(items.length); }

show(new String[] {"a", "b"});      // 2 — String[] is an Object[], passed as THE array
show((Object) new String[] {"a", "b"});   // 1 — one element which is an array
show(new int[] {1, 2});             // 1 — int[] is not an Object[], so it becomes one element
```

An array whose type matches the varargs array type is passed *as* the array, not wrapped. This is the source of "why does my `Object...` method see 2 elements". Cast to `Object` to force wrapping.

## Pitfall 3: generics — heap pollution

```java
static <T> List<T> listOf(T... items) { … }     // warning: possible heap pollution from parameterized vararg type
```

Varargs create an array, and arrays of generic types are unsafe (Module 13). The compiler warns at the declaration and at call sites. If your method only reads the array and never stores it or exposes it, annotate it `@SafeVarargs` (allowed on `static`, `final` and `private` methods and constructors) to promise that and silence the warning. `Arrays.asList`, `List.of` and `EnumSet.of` carry this annotation.

## Cost

Every varargs call allocates an array — trivial in ordinary code, measurable in a hot loop called millions of times. Logging frameworks provide `log(String, Object)` and `log(String, Object, Object)` overloads before the `Object...` version for exactly this reason. Do the same if a varargs method is on a hot path; otherwise do not think about it.

## Design notes

- Put required parameters first, then the varargs: `static int max(int first, int... rest)` guarantees at least one value and avoids a runtime check for an empty array.
- Varargs of a *single* type are clearest. `Object...` accepts anything and defers type errors to run time (`String.format` with mismatched specifiers).
- Do not overload a varargs method with another varargs method of a different but convertible type (`f(int...)` and `f(long...)`); `f()` becomes ambiguous.

## Interview angle

- *"What is a varargs parameter at run time?"* An array; the compiler builds it at the call site.
- *"Where must it appear?"* Last, and only once.
- *"`print(null)` to `print(String...)`?"* The array itself is null — NPE on `.length`.
- *"Which wins, `f(int, int)` or `f(int...)` for `f(1, 2)`?"* The fixed-arity one; varargs is the last resort.

## Key takeaways

- `T... name` is a `T[]` parameter that accepts zero or more values; last position only.
- Fixed-arity overloads always beat varargs; varargs are phase three.
- A bare `null` or a matching array is passed *as* the array — cast to `Object`/`(T) null` to wrap.
- Generic varargs warn; `@SafeVarargs` when you only read the array.
- Each call allocates an array; add small fixed-arity overloads on hot paths.
