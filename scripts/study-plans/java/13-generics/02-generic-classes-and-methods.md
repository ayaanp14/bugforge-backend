---
title: Writing generic classes and methods
minutes: 14
---
Using `List<String>` is the easy half. Writing your own generic types — a `Pair<A, B>`, a `Stack<T>`, a `Result<T>`, a `static <T> T firstOrDefault(List<T>, T)` — is where generics stop being syntax and become a design tool. This lesson covers declaring type parameters on classes, interfaces and methods, how the compiler infers type arguments, and the common mistakes when a class and a method both introduce `T`.

## A generic class

```java
public final class Pair<A, B> {
    private final A first;
    private final B second;

    public Pair(A first, B second) { this.first = first; this.second = second; }
    public A first()  { return first; }
    public B second() { return second; }
    public <C> Pair<A, C> withSecond(C c) { return new Pair<>(first, c); }     // a generic method inside a generic class

    @Override public String toString() { return "(" + first + ", " + second + ")"; }
}

Pair<String, Integer> p = new Pair<>("age", 30);
Pair<String, Double> q = p.withSecond(30.5);
```

The type parameters go after the class name and are in scope throughout the body: fields, constructor parameters, method signatures, nested non-static types. Inside `Pair<A, B>`, `A` and `B` are just types you cannot instantiate or inspect (erasure — lesson 5), but you can store, pass and return them. (A record `record Pair<A, B>(A first, B second) {}` does all of this in one line — records are generic too.)

## A generic stack

```java
public class Stack<T> {
    private Object[] items = new Object[8];        // NOT new T[8] — impossible under erasure
    private int size;

    public void push(T item) {
        if (size == items.length) items = Arrays.copyOf(items, size * 2);
        items[size++] = item;
    }

    @SuppressWarnings("unchecked")
    public T pop() {
        if (size == 0) throw new NoSuchElementException();
        T item = (T) items[--size];                 // the one unavoidable unchecked cast, contained and justified
        items[size] = null;                         // let the GC have it
        return item;
    }

    public boolean isEmpty() { return size == 0; }
}
```

The backing store is `Object[]` and the cast on the way out is unchecked; the class is still safe, because only `push(T)` ever stores into the array. `@SuppressWarnings("unchecked")` on the smallest possible scope, with the reason clear from the code, is the idiom. This is exactly how `ArrayList` is written.

## Generic interfaces

```java
public interface Repository<T, ID> {
    Optional<T> findById(ID id);
    List<T> findAll();
    T save(T entity);
}
public class UserRepository implements Repository<User, Long> { … }     // fix the arguments when implementing
public class InMemoryRepository<T, ID> implements Repository<T, ID> { … }   // or stay generic
```

`Comparable<T>`, `Iterable<T>`, `Function<T, R>` and every collection interface follow this shape. When you implement one, either supply concrete arguments or carry your own parameters through.

## Generic methods

```java
public static <T> T firstOrDefault(List<T> list, T fallback) {
    return list.isEmpty() ? fallback : list.get(0);
}
public static <T extends Comparable<T>> T max(List<T> list) { … }          // bounded — next lesson
public static <K, V> Map<V, K> invert(Map<K, V> map) { … }
public static <T> void swap(T[] array, int i, int j) { … }

String s = firstOrDefault(names, "none");          // T inferred as String from the arguments
Integer n = Main.<Integer>firstOrDefault(List.of(), 0);   // explicit type witness — rarely needed
```

The type parameter list goes **before the return type**. A generic method's parameters are inferred per call from the argument types and the target type, so callers almost never write them. Generic methods may be static — and must be, if they are utilities on a non-generic class; a *class* type parameter cannot be used in a static method (there is no instance to fix it), which is why `static <T>` declares its own.

## Inference

The compiler infers type arguments from: the argument expressions, the target type (assignment, return, parameter), and bounds. It is good but not magic:

```java
List<String> empty = Collections.emptyList();       // T = String from the target
var e = Collections.emptyList();                    // T = Object — no target to infer from
process(Collections.emptyList());                   // Java 8+ infers from process's parameter type
List<Number> nums = List.of(1, 2.0);                // T inferred as Number & Comparable<…> — works; the lub of Integer and Double
```

When inference fails ("incompatible types: inference variable T has incompatible bounds"), add a witness (`Collections.<String>emptyList()`), a typed local variable, or a lambda parameter type.

## Class parameter versus method parameter

```java
public class Box<T> {
    private T value;
    public <T> void confuse(T other) { … }        // a NEW, unrelated T that SHADOWS the class's T — a bug
    public void set(T v) { value = v; }           // the class's T
    public <U> Box<U> map(Function<T, U> f) { return new Box<>(f.apply(value)); }   // right: new parameter named U
}
```

Redeclaring the class's parameter name on a method creates a second, independent parameter and silently breaks the connection. Use a fresh letter for method-level parameters inside generic classes.

## Static members and type parameters

```java
public class Registry<T> {
    private static T shared;               // compile error: non-static type variable T cannot be referenced from a static context
    private static int count;              // fine
    public static <T> Registry<T> empty() { return new Registry<>(); }   // its own T
}
```

The class's `T` is per-instance in concept; statics are per-class, and there is one class for all `T`s under erasure. A static factory declares its own type parameter.

## Multiple parameters and naming

`Map<K, V>`, `BiFunction<T, U, R>`, `Pair<A, B>`: as many as needed, comma-separated. Keep to single capitals; name by role (`K`, `V`, `E`, `R`); do not reuse a name in nested scopes.

## Generic constructors and nested types

Constructors may declare their own type parameters (`<T> Box(T seed)`) — rare. A non-static inner class of a generic class sees the outer's parameters (`Box<T>.Inner` may use `T`); a static nested class does not (`static class Node<T>` needs its own).

## Interview angle

- *"Where does a generic method's type parameter go?"* Before the return type: `static <T> T f(…)`.
- *"Can a static method use the class's type parameter?"* No — it declares its own.
- *"How do you create a `T[]` inside a generic class?"* You cannot directly; use `Object[]` with a contained unchecked cast, or `Array.newInstance` with a `Class<T>`.
- *"What is the diamond?"* `<>` — infer the constructor's type arguments from the target type.
- *"What goes wrong if a method redeclares `<T>` inside `Box<T>`?"* It shadows the class parameter with an unrelated one.

## Key takeaways

- Class/interface parameters go after the name and are in scope for the body; method parameters go before the return type and are inferred per call.
- Backing arrays are `Object[]` with one contained, suppressed cast — the `ArrayList` pattern.
- Statics cannot use the class's parameter; declare their own. Never shadow a class parameter on a method.
- Inference uses arguments, target type and bounds; give a witness or a typed variable when it fails.
