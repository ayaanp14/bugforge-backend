---
title: Interfaces — contracts without implementation
minutes: 13
seo-title: What Is an Interface in Java? Implements and Marker Interfaces
description: A Java interface is a contract of public abstract methods; a class can implement several at once. Constants, programming to an interface and marker interfaces.
question: What is an interface in Java?
answer: An interface in Java is a type defined by the methods a class must provide: abstract method signatures that are implicitly `public abstract`, plus `public static final` constants and no instance state. A class `implements` any number of interfaces, and code written against the interface type — such as `List<String> names = new ArrayList<>()` — works with every implementation.
q: Can an interface have fields in Java?
a: Only constants. Every field declared in an interface is implicitly `public static final`, so interfaces have no instance state to inherit. Putting constants in an interface for classes to implement is an anti-pattern; use a `final` class with a private constructor instead.
q: Why must interface methods be implemented as public in Java?
a: Interface methods are implicitly `public`, and an implementation cannot narrow the access of the method it overrides. Leaving out `public` in the class gives the compile error "attempting to assign weaker access privileges".
q: Can a class implement multiple interfaces in Java?
a: Yes — a class can implement any number, as in `class Duck implements Swimmer, Flyer`, which is how Java provides multiple inheritance of type. If two interfaces declare the same abstract method signature, one implementation satisfies both.
q: What is a marker interface in Java?
a: A marker interface has no methods and tags a class as a type that library code can test with `instanceof`; `Serializable`, `Cloneable` and `RandomAccess` are examples. Annotations now do most tagging, but a marker interface still helps when a method parameter must require the tag.
q: Why declare `List<String> list = new ArrayList<>()` instead of using ArrayList as the type?
a: Declaring variables and parameters with the interface type means code depends on the contract, not one class. Swapping in a `LinkedList` then changes a single line, and a method that takes `List<String>` accepts every list rather than only `ArrayList`.
---
An interface is a **type** defined purely by what it can do: a set of method signatures with no state and (originally) no bodies. A class that `implements` an interface promises to provide those methods, and any code written against the interface type works with every implementation, present and future. Interfaces are how Java achieves multiple inheritance of *type*, and "program to an interface" is the most repeated design advice in the language for good reason.

## Declaring and implementing

```java
public interface Shape {
    double area();                       // implicitly public abstract
    double perimeter();
    int SIDES_UNKNOWN = -1;              // implicitly public static final — a constant
}

public class Circle implements Shape {
    private final double r;
    public Circle(double r) { this.r = r; }
    @Override public double area()      { return Math.PI * r * r; }      // MUST be public
    @Override public double perimeter() { return 2 * Math.PI * r; }
}
```

Rules:

- Interface methods without a body are `public abstract`, whether you write the words or not. An implementing class must declare them `public` — the most common compile error when implementing an interface ("attempting to assign weaker access privileges").
- Fields in an interface are `public static final` constants. Interfaces cannot have instance fields; there is no state to inherit.
- Interfaces have no constructors and cannot be instantiated: `new Shape()` is an error. `Shape s = new Circle(1)` is the whole point.
- A class implements **any number** of interfaces: `class Duck implements Swimmer, Flyer, Comparable<Duck>`.
- An interface can `extends` other interfaces (one or several): `interface SortedSet<E> extends Set<E>`.
- A class that does not implement every abstract method must be declared `abstract`.

## The type, not the class

```java
List<String> names = new ArrayList<>();      // declare with the interface; construct with the class
Set<Integer> ids = new HashSet<>();
Map<String, Integer> counts = new HashMap<>();
Comparable<Version> c = version;
```

Declaring variables, fields, parameters and return types as interfaces keeps the choice of implementation local: swapping `ArrayList` for `LinkedList`, or `HashMap` for `TreeMap`, changes one line. Methods that take `List<String>` accept every list; methods that take `ArrayList<String>` accept one class. The JDK's collections are the model: `List`, `Set`, `Map`, `Queue` are interfaces; the classes are details.

## Polymorphism through interfaces

```java
double total(List<Shape> shapes) {
    double sum = 0;
    for (Shape s : shapes) sum += s.area();     // dispatches to Circle.area, Square.area, …
    return sum;
}
```

Exactly the dynamic dispatch of Module 8, without a class hierarchy: `Circle` and `Square` need share no parent, no fields, nothing but the promise `Shape`. Unrelated classes can share a capability — a `String` and a `LocalDate` are both `Comparable`; a `Thread` and a lambda are both `Runnable`.

## Interfaces the JDK expects you to implement

| Interface | Method(s) | Enables |
| --- | --- | --- |
| `Comparable<T>` | `int compareTo(T o)` | `Collections.sort`, `TreeMap`, `Arrays.sort` on your type |
| `Comparator<T>` | `int compare(T a, T b)` | Alternative orderings, passed to `sort` |
| `Runnable` | `void run()` | Threads, executors |
| `Callable<V>` | `V call()` | Tasks that return a value |
| `Iterable<T>` | `Iterator<T> iterator()` | For-each over your type |
| `AutoCloseable` | `void close()` | Try-with-resources |
| `Supplier<T>`, `Function<T,R>`, `Predicate<T>`, `Consumer<T>` | one method each | Lambdas (lesson 3, Module 11) |

`Comparable` is the one to know cold: implement it on any value type with a natural order, using `Integer.compare`/`Double.compare` per field, most significant first, consistent with `equals` (if `compareTo` returns 0, `equals` should be true — `BigDecimal` famously breaks this).

## Interfaces as roles

An interface names a **role** a class can play: `Closeable`, `Serializable`, `Comparable`, `Iterable`. Naming follows suit — adjectives (`-able`) or nouns describing a capability (`Shape`, `Repository`, `EventListener`). A class can play many roles; a class hierarchy could not express that.

## Marker interfaces

`Serializable`, `Cloneable`, `RandomAccess` have **no methods**. They tag a class so that library code can test `instanceof` and behave accordingly. Annotations (`@FunctionalInterface`, `@Deprecated`) are the modern mechanism for most tagging; marker interfaces survive where the marker must be a *type* (a method parameter can require `Serializable`).

## Constants in interfaces — a smell

Putting constants in an interface so classes can `implements` it to "inherit" them (`class Foo implements Constants`) pollutes the class's public API with unrelated constants. Use a `final` class with `private` constructor, or `static import`. The constant-interface pattern is *Effective Java* item 22.

## Access and nesting

Top-level interfaces are `public` or package-private, like classes. Interfaces may be nested in classes and other interfaces (implicitly `static`). Members of an interface are always `public` — except the `private` helper methods added in Java 9 (next lesson).

## Evolving an interface

Adding an abstract method to a published interface breaks every implementation. That is why Java 8 added **default methods** (next lesson): `List.sort`, `Collection.stream` and `Iterable.forEach` were added to interfaces implemented by thousands of classes without breaking one. Design interfaces small and stable; add capabilities as new interfaces or defaults.

## Interview angle

- *"Can an interface have fields?"* Only `public static final` constants.
- *"Why must implementing methods be public?"* Interface methods are implicitly public; an override cannot narrow access.
- *"Can a class implement two interfaces with the same method signature?"* Yes — one implementation satisfies both (if return types agree).
- *"Why declare `List<String> x = new ArrayList<>()`?"* To depend on the contract, not the class.
- *"What is a marker interface?"* An empty interface used as a type tag: `Serializable`.

## Key takeaways

- An interface is a contract of public abstract methods (plus constants); a class implements any number of them.
- Program to the interface: declare variables and parameters as `List`, `Map`, `Shape`; construct concrete classes.
- Unrelated classes share behaviour through interfaces — polymorphism without a hierarchy.
- Know `Comparable`, `Comparator`, `Runnable`, `Iterable`, `AutoCloseable` and the functional interfaces.
- Keep interfaces small; evolve them with default methods, not new abstract ones.
