---
title: Bounded type parameters
minutes: 12
seo-title: Bounded Type Parameters in Java: Extends and Comparable
description: A bounded type parameter like T extends Number limits a Java generic to subtypes and unlocks their methods. The recursive Comparable bound and multiple bounds.
question: What is a bounded type parameter in Java?
answer: A bounded type parameter restricts a Java generic to a type and its subtypes: `<T extends Number>` accepts `Integer` or `Double` but not `String`. In exchange the body may call the bound's methods, such as `doubleValue()`. `extends` is used for classes and interfaces alike, several bounds join with `&`, and under erasure `T` becomes its first bound.
q: What does `<T extends Comparable<T>>` mean in Java?
a: It means `T` must be a type that can be compared with other values of type `T`, so the method body may call `compareTo`. `String`, `Integer` and any class implementing `Comparable` of itself qualify. Because the bound mentions `T` itself, it is called a recursive bound.
q: Why does the JDK use `Comparable<? super T>` instead of `Comparable<T>`?
a: To accept classes that inherit their comparability from a parent. If `Employee implements Comparable<Employee>` and `Manager extends Employee`, `Manager` is not `Comparable<Manager>`, but it is comparable through a supertype, so `max` over a list of managers still compiles.
q: Can a type parameter have a lower bound in Java?
a: No. `<T super Integer>` does not exist; lower bounds are available only on wildcards, as in `List<? super Integer>`. Type parameters take upper bounds only, written with `extends`.
q: How do you declare multiple bounds on a generic type?
a: Join them with `&`: `<T extends Number & Comparable<T>>`. `T` must satisfy every bound; at most one bound may be a class, and it must come first, followed by any interfaces. Erasure replaces `T` with the first bound.
q: What does "inference variable T has incompatible bounds" mean?
a: Usually that the argument types do not satisfy the type parameter's bound — not that inference is broken. Calling a `<T extends Comparable<T>>` method with a list of objects that are not `Comparable` fails this way; check the argument types first.
---
An unbounded `T` is any reference type, which means inside the method you can do nothing with it except store and return it — no `compareTo`, no `doubleValue`, no `close`. A **bound** restricts `T` to subtypes of a given type and, in exchange, lets you call that type's methods. Bounds are what make a generic `max`, a generic `sum` and a generic `sort` possible, and the recursive form `<T extends Comparable<T>>` is the one everyone stumbles over the first time.

## Upper bounds with `extends`

```java
public static <T extends Number> double sum(List<T> values) {
    double total = 0;
    for (T v : values) total += v.doubleValue();      // allowed: T is a Number
    return total;
}

sum(List.of(1, 2, 3));             // T = Integer
sum(List.of(1.5, 2.5));            // T = Double
sum(List.of("a"));                 // compile error: String is not within bound Number
```

`<T extends Number>` reads "T is `Number` or a subtype". `extends` is used whether the bound is a class or an interface — there is no `implements` in a bound. With the bound, every method of `Number` is available on a `T`; without it, only `Object`'s.

Under erasure, `T` compiles to its bound (`Number`) rather than `Object`, so the bytecode calls `Number.doubleValue` directly.

## Multiple bounds

```java
public static <T extends Number & Comparable<T>> T clampedMax(List<T> xs) { … }
```

`&` joins bounds: `T` must satisfy all. At most one may be a class and it must come first; the rest are interfaces. Erasure uses the first bound. Multiple bounds are uncommon; when you need them, consider whether a small interface capturing the combination would read better.

## `Comparable` and the recursive bound

The canonical generic `max`:

```java
public static <T extends Comparable<T>> T max(List<T> xs) {
    T best = xs.get(0);
    for (T x : xs) if (x.compareTo(best) > 0) best = x;
    return best;
}
```

`<T extends Comparable<T>>` says: `T` can be compared **to itself**. `String implements Comparable<String>`, `Integer implements Comparable<Integer>`, your `Version implements Comparable<Version>` — all qualify. The bound *mentions the parameter it bounds*; that is a *recursive* (F-bounded) type parameter, and it looks alarming until you read it as "a T that knows how to compare with other Ts".

The JDK's real signature goes one step further:

```java
public static <T extends Comparable<? super T>> T max(Collection<? extends T> coll)
```

`? super T` allows a class that inherits its `Comparable` from a parent: if `Employee implements Comparable<Employee>` and `Manager extends Employee`, then `max(List<Manager>)` works because `Manager` is comparable *via* `Comparable<Employee>`, a supertype of `Manager`. Wildcards are the next lesson; note now that the flexible form is what library code uses.

## Bounds on class type parameters

```java
public class SortedBag<T extends Comparable<T>> {
    private final List<T> items = new ArrayList<>();
    public void add(T item) {
        int i = 0;
        while (i < items.size() && items.get(i).compareTo(item) < 0) i++;     // compareTo available on T
        items.add(i, item);
    }
}
SortedBag<Integer> ints = new SortedBag<>();
SortedBag<Object> objs = new SortedBag<>();        // compile error: Object is not Comparable
```

A class-level bound applies everywhere the class is instantiated — the compiler refuses `SortedBag<Object>`.

## Bounds and inference

Bounds participate in inference: `max(List.of(3, 1, 2))` infers `T = Integer` and checks `Integer extends Comparable<Integer>`. A failed bound yields "inference variable T has incompatible bounds" — the message means the argument type does not satisfy the bound, not that inference is broken.

## No lower bounds on type parameters

`<T super Integer>` does **not** exist. Lower bounds are only available on wildcards (`List<? super Integer>`) — next lesson — because a lower-bounded type *parameter* would rarely mean anything useful for the method body.

## Bounds versus overloading versus `Object`

Three ways to write a method that works on many types:

- **`Object` parameter**: accepts anything, can do nothing type-specific, returns `Object` — pre-generics style.
- **Overloads** per type: `max(int[])`, `max(double[])`, `max(String[])` — repetitive; the JDK's `Math.max` is this for primitives, which cannot be generic.
- **Bounded generic**: one implementation, type-checked calls, typed return — the answer for reference types.

## Reading a bounded signature

`static <K extends Comparable<K>, V> Map<K, V> sortedByKey(Map<K, V> m)` — two parameters; `K` must be self-comparable; `V` unconstrained; takes and returns a map with those parameters. Read bounds as constraints on *who may call*, and as *what the body may do* with the values.

## Interview angle

- *"What does `<T extends Comparable<T>>` mean?"* `T` must be a type that can be compared with other `T`s — so the body can call `compareTo`.
- *"Why `Comparable<? super T>` in the JDK's `max`?"* To accept subclasses that inherit `Comparable` from a parent.
- *"Can you write `<T super Number>`?"* No; lower bounds exist only on wildcards.
- *"Multiple bounds?"* `<T extends A & B & C>` — one class (first), any interfaces.
- *"What does erasure turn a bounded `T` into?"* Its first bound.

## Key takeaways

- `<T extends Bound>` restricts callers and unlocks the bound's methods in the body; `extends` for classes and interfaces alike.
- `<T extends Comparable<T>>` is the self-comparable bound behind every generic `max`/`sort`; the JDK's `Comparable<? super T>` also admits inherited comparability.
- `&` combines bounds (class first). No lower bounds on type parameters.
- Bounds on class parameters restrict every instantiation.
