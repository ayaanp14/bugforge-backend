---
title: var and type inference — what the compiler already knows
minutes: 12
---
`var list = new ArrayList<String>();` — Java 10 let you stop writing the type twice. `var` is **local variable type inference**: the variable is still statically typed, the compiler simply works the type out from the initialiser. It is not dynamic typing, not `Object`, and not optional in the places it is allowed — a `var` with no initialiser is a compile error. This lesson covers exactly where `var` is permitted, what type it infers (including the surprising cases), the style rules that keep it readable, and the other inference features it joined: the diamond, generic method inference and lambda parameter inference.

## The rules

`var` is allowed for: local variables **with an initialiser**, the index of a `for` loop, the variable of an enhanced `for`, try-with-resources variables, and (Java 11) lambda parameters when every parameter uses it. It is **not** allowed for fields, method parameters, return types, or a local initialised to `null` or to a lambda / method reference (no target type to infer from).

```java
var count = 0;                            // int
var name = "Ada";                         // String
var names = new ArrayList<String>();      // ArrayList<String> — the concrete class, not List
var map = new HashMap<String, List<Integer>>();
for (var entry : map.entrySet()) { … }    // Map.Entry<String, List<Integer>>: the one place var saves the most typing
try (var in = Files.newBufferedReader(path)) { … }
var f = (Function<String, Integer>) String::length;   // needs the cast; `var f = String::length` does not compile

var x;                 // error: cannot infer type
var n = null;          // error
var list = List.of(); // List<Object> — probably not what you meant
```

`var` is a *reserved type name*, not a keyword: `int var = 1;` still compiles, so old code is unaffected — which is the only reason it could be added at all.

## What type does it infer?

The **static type of the initialiser expression**, with two adjustments. First, the type is the *concrete* type, not an interface: `var list = new ArrayList<String>()` is `ArrayList<String>`, so you cannot later assign a `LinkedList` to it — write `List<String> list = new ArrayList<>()` when you want the interface type. Second, for an expression whose type cannot be denoted — an anonymous class, a capture of a wildcard, an intersection type — `var` gives you that undenotable type, which was impossible before:

```java
var counter = new Object() { int n; void inc() { n++; } };
counter.inc();                            // legal: the anonymous class's own members are visible
```

Literals infer as expected — `var d = 1.0` is `double`, `var l = 1L` is `long`, `var b = (byte) 1` is `byte` — and `var c = 'a'` is `char`, not `int`. Ternaries infer the common supertype: `var v = flag ? 1 : "one"` is `Serializable & Comparable<…>`, a sign that you should not have written that.

## Style: when `var` helps and when it hides

The guidelines from the JDK team (JEP 286's style guide) reduce to one test: **can the reader tell the type from the line?**

```java
var users = userRepository.findActive();        // hides: is it a List? Set? Stream? Optional?
List<User> users = userRepository.findActive(); // says it
var userCount = users.size();                   // fine: obviously an int
var in = new BufferedReader(new InputStreamReader(System.in));   // fine: the type is on the right
var byCity = people.stream().collect(groupingBy(Person::city, TreeMap::new, counting()));   // hides: Map<String, Long>? write it
```

Use `var` when the initialiser names the type (`new X(...)`, a literal, a cast, a factory whose name says the type — `Path.of`, `List.of`), when the type is long and obvious from context (the `Map.Entry` in a for-each), or when the variable is short-lived. Avoid it when the type carries information the reader needs, when the method name is generic (`get`, `process`, `handle`), and when the inferred type is a concrete class you would rather have been an interface. Good variable names matter more with `var`: `var count = …` is clear; `var result = …` is not.

## The rest of the inference family

- **Diamond (Java 7):** `new ArrayList<>()` infers the type argument from the assignment target. Since Java 9 it works with anonymous classes too: `new Comparator<>() { … }`.
- **Generic method inference:** `Collections.emptyList()` and `List.of()` infer their type argument from the target — `List<String> l = List.of();`. In an argument position Java 8's *target typing* extended this: `process(List.of())` infers from `process`'s parameter type.
- **Lambda parameter inference:** `(a, b) -> a + b` gets its parameter types from the functional interface it is assigned to; `(var a, var b) -> a + b` (Java 11) says the same thing but lets you put an annotation on the parameter (`(@Nonnull var s) -> …`), which was the whole point.
- **Pattern variables** (next lesson): `if (o instanceof String s)` infers `s` as `String`.

Inference never crosses statement boundaries and never uses later assignments: the type is fixed at the declaration.

## `var` in interviews

The question is rarely "does `var` exist" and usually "is Java dynamically typed now?" (no — the type is inferred once and fixed), "can you use `var` for a field?" (no), "what is `var x = new ArrayList<>()`?" (`ArrayList<Object>` — the diamond has no target to infer from, a genuine trap), and "when would you not use it?" (when the type is not obvious from the right-hand side).

## Interview angle

- *"Is `var` dynamic typing?"* No — static inference from the initialiser; the type never changes.
- *"Where can't you use `var`?"* Fields, parameters, return types, without an initialiser, with `null`, with a bare lambda or method reference.
- *"`var list = new ArrayList<>()` has what type?"* `ArrayList<Object>` — there is no target for the diamond.
- *"Why is `var` a reserved type name rather than a keyword?"* Backwards compatibility: `var` remained a legal identifier.
- *"Why allow `var` in lambda parameters?"* Uniformity, and to allow annotations on inferred parameters.

## Key takeaways

- `var` = local inference from the initialiser; static, fixed, concrete type — `ArrayList`, not `List`.
- Locals, `for`, for-each, try-with-resources, lambda parameters (all or none); never fields, parameters, `null`, bare lambdas.
- Readability test: can the reader tell the type from the line? Name variables well.
- Diamond, generic method inference and lambda inference are the same idea from the other side.
- `new ArrayList<>()` with `var` is `ArrayList<Object>`; `List.of()` with `var` is `List<Object>`.
