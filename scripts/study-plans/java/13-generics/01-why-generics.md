---
title: Why generics exist
minutes: 12
---
Before Java 5, a `List` held `Object`s: you put a `String` in and got an `Object` out, cast it back, and found out at run time if you were wrong. Generics let you say `List<String>` — a list *of strings* — so the compiler checks what goes in and knows what comes out. This lesson is the problem generics solve, the vocabulary (type parameter, type argument, parameterised type, raw type), and the first look at the design decision — erasure — that explains every limitation you will meet later in the module.

## The problem

```java
List names = new ArrayList();            // pre-generics: a list of Object
names.add("Ada");
names.add(42);                           // nothing stops this
String first = (String) names.get(0);    // cast required…
String second = (String) names.get(1);   // …and this one throws ClassCastException at RUN time
```

Three costs: casts everywhere, no documentation of what the list holds, and errors that surface far from their cause — the `42` was added in one file and exploded in another.

## The solution

```java
List<String> names = new ArrayList<>();
names.add("Ada");
names.add(42);                           // compile error: incompatible types: int cannot be converted to String
String first = names.get(0);             // no cast: the compiler knows it is a String
```

`List<String>` is a **parameterised type**: the generic interface `List<E>` with the **type argument** `String` supplied for its **type parameter** `E`. Inside `List`, every `E` now means `String`, so `add(E)` accepts only strings and `get(int)` returns one. The error moves to compile time, to the line that is actually wrong.

## Vocabulary

| Term | Example | Meaning |
| --- | --- | --- |
| Generic type | `List<E>`, `Map<K, V>` | A type declared with type parameters |
| Type parameter | `E`, `K`, `V`, `T` | A placeholder in the declaration |
| Type argument | `String` in `List<String>` | The actual type supplied at use |
| Parameterised type | `List<String>` | A generic type with arguments |
| Raw type | `List` | A generic type used without arguments — legacy, unsafe |
| Generic method | `static <T> T first(List<T> xs)` | A method with its own type parameters |
| Bounded type | `<T extends Comparable<T>>` | A parameter restricted to subtypes of something |
| Wildcard | `List<?>`, `List<? extends Number>` | An unknown type argument, possibly bounded |

Conventions: single capital letters — `T` (type), `E` (element), `K`/`V` (key/value), `R` (result), `N` (number). Two-letter names are unusual; descriptive names are not idiomatic.

## Type arguments must be reference types

`List<int>` is a compile error; `List<Integer>` with autoboxing is how primitives get in. This costs boxing (Module 2) and is the reason `IntStream`, `int[]` and primitive-specialised functional interfaces exist. Project Valhalla is working on lifting this; for now, wrappers.

## The diamond

```java
Map<String, List<Integer>> index = new HashMap<String, List<Integer>>();   // Java 5–6
Map<String, List<Integer>> index = new HashMap<>();                        // Java 7+: infer from the left side
var index = new HashMap<String, List<Integer>>();                          // Java 10+: infer the variable's type instead
```

`<>` tells the compiler to infer the constructor's type arguments from the target type. Combine it with `var` and the arguments must be on the right instead — never `var x = new HashMap<>()`, which infers `HashMap<Object, Object>`.

## Raw types: why they still exist and why you avoid them

`List` without arguments is a **raw type**. It compiles for backwards compatibility with pre-2004 code, with warnings ("unchecked call"), and it turns off checking:

```java
List<String> safe = new ArrayList<>();
List raw = safe;                         // allowed, warning
raw.add(42);                             // allowed, warning — pollutes the String list
String s = safe.get(0);                  // ClassCastException here, far from the raw add
```

Never write a raw type in new code. The one legitimate appearance is in class literals and `instanceof` (`List.class`, `x instanceof List`), because those cannot carry type arguments — the next section explains why.

## Erasure, in one paragraph

Generics were added to a language with ten years of compiled libraries and a JVM that knew nothing about them. The design chosen was **erasure**: type arguments exist for the compiler only. After checking, `List<String>` compiles to plain `List`, `T` becomes `Object` (or its bound), and casts are inserted where the code reads elements. At run time there is one `List` class, no `List<String>`, and `new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()` is `true`. This kept old code running unchanged and is the reason for every "you cannot do that with generics" rule in lesson 5. Understand it now and the rules will feel inevitable rather than arbitrary.

## What you gain, concretely

- **Compile-time safety**: wrong-type insertions are errors at the line that is wrong.
- **No casts** in reading code.
- **Documentation**: `Map<CustomerId, List<Order>>` says what a structure holds; `Map` says nothing.
- **Reusable algorithms**: one `sort`, one `max`, one `filter` for every element type, without `Object` and casts.
- **APIs that describe themselves**: `Function<String, Integer>` tells you the whole contract.

## Reading generic signatures

`public static <T extends Comparable<? super T>> void sort(List<T> list)` — read it left to right: a generic method with parameter `T`, where `T` must be comparable to itself or a supertype; takes a list of `T`; returns nothing. By the end of this module every part of that line will be obvious. Until then, the skill is to not panic: find the type parameters, their bounds, and where they appear in the parameters and return.

## Interview angle

- *"What are generics for?"* Compile-time type safety and reuse without casts; errors move to the source line.
- *"What is a raw type and why avoid it?"* A generic type without arguments; it disables checking and pollutes typed collections.
- *"Can you have a `List<int>`?"* No — type arguments must be reference types; use `Integer` (boxing) or `int[]`.
- *"What is erasure?"* Type arguments are compile-time only; at run time `List<String>` is `List`.

## Key takeaways

- Generics move type errors from run time (casts) to compile time (the wrong line) and document what collections hold.
- Vocabulary: type parameter `E`, type argument `String`, parameterised type `List<String>`, raw type `List`.
- Reference types only; the diamond `<>` infers constructor arguments from the target.
- Raw types are legacy — never in new code except class literals and `instanceof`.
- Erasure: generics are for the compiler; run time sees the raw class.
