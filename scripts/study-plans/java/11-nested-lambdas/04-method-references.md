---
title: Method references — the four kinds
minutes: 11
---
When a lambda does nothing but call one existing method — `s -> s.length()`, `x -> Integer.parseInt(x)`, `() -> new ArrayList<>()` — Java lets you name the method instead with `::`. A **method reference** is exactly as expressive as the lambda it replaces, slightly shorter, and often clearer because the reader sees a name rather than a pipeline of parameters. There are four kinds, and knowing which one you are looking at is what makes `String::compareToIgnoreCase` and `this::process` readable.

## The four kinds

| Kind | Syntax | Equivalent lambda | Example |
| --- | --- | --- | --- |
| **Static** | `Class::staticMethod` | `(args) -> Class.staticMethod(args)` | `Integer::parseInt`, `Math::max` |
| **Bound** (a particular object) | `object::method` | `(args) -> object.method(args)` | `System.out::println`, `this::process`, `str::equals` |
| **Unbound** (first argument is the receiver) | `Class::instanceMethod` | `(obj, args) -> obj.method(args)` | `String::length`, `String::compareTo` |
| **Constructor** | `Class::new`, `Type[]::new` | `(args) -> new Class(args)` | `ArrayList::new`, `int[]::new`, `Person::new` |

```java
Function<String, Integer> parse = Integer::parseInt;        // static: s -> Integer.parseInt(s)
Consumer<Object> print = System.out::println;               // bound: x -> System.out.println(x)  (the PrintStream is captured now)
Function<String, Integer> length = String::length;          // unbound: s -> s.length()
Comparator<String> cmp = String::compareToIgnoreCase;       // unbound, two args: (a, b) -> a.compareToIgnoreCase(b)
Supplier<List<String>> make = ArrayList::new;               // constructor: () -> new ArrayList<>()
Function<Integer, int[]> array = int[]::new;                // array constructor: n -> new int[n]
BiFunction<String, Integer, Person> build = Person::new;    // picks the (String, int) constructor by the target type
```

The compiler matches the reference against the target interface's single method: the parameter count and types decide which kind it is and which overload it means. `String::compareTo` targeting `Comparator<String>` (two parameters) is unbound — the first parameter becomes the receiver, the second the argument.

## Bound versus unbound

The subtle pair:

```java
String prefix = "user_";
Predicate<String> startsWithPrefix = prefix::startsWith;      // BOUND: s -> prefix.startsWith(s) — receiver fixed now
Predicate<String> isUser = s -> s.startsWith(prefix);         // the lambda you probably meant
BiPredicate<String, String> starts = String::startsWith;      // UNBOUND: (a, b) -> a.startsWith(b)
```

`Class::method` with an instance method is unbound — the object comes as the first argument at call time. `variable::method` is bound — the object is captured when the reference is created, and its state at that moment is what the method sees. `System.out::println` is bound to the `PrintStream` that `System.out` held when you wrote it.

## Overload resolution with references

A reference names a method, not an overload; the target type selects:

```java
Function<String, Integer> a = Integer::valueOf;           // valueOf(String)
IntFunction<Integer> b = Integer::valueOf;                // valueOf(int)
Consumer<String> c = System.out::println;                 // println(String)
```

When two overloads fit equally, the reference is ambiguous and the compiler asks for a lambda with explicit parameter types.

## `this::` and `super::`

```java
list.forEach(this::log);                    // bound to the current instance
Function<String, String> f = super::describe;   // the superclass's implementation, bound to this
```

`this::method` is the idiomatic way to pass an instance method as a callback and is what "extract a long lambda into a method" produces.

## When to use which

- Use a **method reference** when the lambda would be exactly one call with the parameters passed through in order. `x -> foo(x)` → `this::foo`; `(a, b) -> a.compareTo(b)` → `String::compareTo`.
- Use a **lambda** when arguments are rearranged, transformed or partially fixed (`s -> s.startsWith(prefix)`), when there is more than one call, or when the reference would be *less* clear (`x -> x` beats `Function.identity()` for some readers; `Function.identity()` beats `x -> x` in a `toMap`).
- **Avoid** references that look like one kind and are another (`prefix::startsWith` above) — the lambda states the intent.

## Readability examples

```java
names.stream().map(String::toUpperCase).forEach(System.out::println);
people.sort(Comparator.comparing(Person::lastName).thenComparing(Person::firstName));
Map<String, List<Person>> byCity = people.stream().collect(Collectors.groupingBy(Person::city));
List<Integer> sizes = lists.stream().map(List::size).toList();
Optional<Person> oldest = people.stream().max(Comparator.comparingInt(Person::age));
String[] arr = list.toArray(String[]::new);
```

Each reference reads as "the length", "the last name", "print" — the reader is spared the parameter plumbing.

## Interview angle

- *"What are the kinds of method reference?"* Static, bound instance, unbound instance, constructor.
- *"`String::length` — what does the first parameter become?"* The receiver: unbound instance method reference.
- *"Is a method reference a lambda?"* Semantically yes — it compiles the same way and needs a functional-interface target.
- *"When is `Class::method` ambiguous?"* When several overloads match the target's parameter types; use a lambda with typed parameters.

## Key takeaways

- `Class::static`, `obj::instance` (bound: receiver captured now), `Class::instance` (unbound: receiver is the first argument), `Class::new`.
- The target functional interface selects the kind and the overload.
- Use references for straight pass-through calls; lambdas when arguments are reshaped or intent needs stating.
- `this::method` is the callback idiom and the result of extracting a long lambda.
