---
title: Static nested and inner classes
minutes: 13
---
A class can be declared inside another class. Java has four kinds of such *nested* classes — static nested, inner (non-static member), local and anonymous — and the first two differ in one crucial way: an **inner** class instance secretly holds a reference to an instance of the outer class; a **static nested** class does not. That reference is convenient, and it is also the cause of memory leaks and confusing `this` rules. This lesson makes the distinction sharp and gives the rule for which to use.

## Static nested classes

```java
public class LinkedStack<T> {
    private static class Node<T> {            // static nested: a helper type in the outer class's namespace
        final T value;
        final Node<T> next;
        Node(T value, Node<T> next) { this.value = value; this.next = next; }
    }

    private Node<T> head;

    public void push(T v) { head = new Node<>(v, head); }
    public T pop() { T v = head.value; head = head.next; return v; }
}
```

A static nested class is an ordinary class that happens to live inside another, for scoping and packaging. It has **no reference to an outer instance**; it can be created without one (`new LinkedStack.Node<>(…)` from outside, if accessible, or just `new Node<>(…)` inside). It can access the outer class's `static` members and — because nesting is a trust relationship — the outer class's `private` static members. The outer class can access the nested class's private members too.

Use it for: helper types that belong to one class (`Map.Entry`, `HashMap.Node`, builders — `Pizza.Builder`), and for grouping small related types. This should be your **default** kind of nested class.

## Inner classes (non-static member classes)

```java
public class Outer {
    private int count = 0;

    public class Counter {                    // inner: every Counter belongs to an Outer instance
        public void increment() { count++; }   // reads the OUTER instance's field directly
        public Outer owner() { return Outer.this; }
    }

    public Counter counter() { return new Counter(); }    // created inside an instance method: implicit outer = this
}

Outer o = new Outer();
Outer.Counter c = o.counter();
Outer.Counter c2 = o.new Counter();           // explicit outer instance — rarely seen, but this is the syntax
c.increment();                                // o.count is now 1
```

An inner class instance carries a hidden field, `Outer.this`, pointing at the outer instance it was created from. Inside it, unqualified names resolve outward: `count` means `Outer.this.count`. `this` alone is the inner instance; `Outer.this` is the outer.

Consequences:

- Cannot be created without an outer instance (`new Counter()` from a static method fails: "an enclosing instance that contains Outer.Counter is required").
- Before Java 16, inner classes could not declare static members (except constants); since Java 16 they can.
- **Every inner instance keeps its outer instance alive.** A `Counter` stored in a long-lived collection prevents its `Outer` from being garbage-collected — the classic Java memory leak, historically in Android with inner-class listeners holding `Activity`s.

Use it when the inner object genuinely *is part of* the outer's state and needs its fields: an `Iterator` implementation inside a collection (`ArrayList.Itr` is an inner class reading `ArrayList`'s array and `modCount`), an event-handler that manipulates the enclosing component.

## The rule

*Effective Java* item 24: **if a nested class does not need access to the enclosing instance, make it static.** Every non-static nested class costs a hidden field, a hidden constructor parameter, and a lifetime dependency. IDEs warn "inner class may be static" for exactly this reason. Start with `static`; remove it only when you need `Outer.this`.

## Nested types of other kinds

- **Nested interfaces, enums and records** are implicitly `static` — they can never be inner classes.
- A nested class inside an **interface** is implicitly `public static`.
- Nesting depth is unlimited; more than two levels is a design smell.

## Access, visibility and naming

Nested classes may use all four access levels (top-level classes only two). A private nested class is visible only within the top-level class that contains it — including to sibling nested classes. From outside, the name is `Outer.Nested`; the compiled class file is `Outer$Nested.class`, which you will see in stack traces and `javap` output. Anonymous classes compile to `Outer$1.class`, `Outer$2.class`.

## Shadowing outward

```java
public class Outer {
    int x = 1;
    class Inner {
        int x = 2;
        void show(int x) {
            System.out.println(x);            // 3: the parameter
            System.out.println(this.x);       // 2: Inner's field
            System.out.println(Outer.this.x); // 1: Outer's field
        }
    }
}
```

Names resolve innermost first; qualify to reach outer levels. Avoid shadowing across nesting levels — it is legal and unreadable.

## Inner classes and inheritance

An inner class can extend another class and be extended; a subclass of an inner class must also have an outer instance, which makes such hierarchies awkward. Interfaces implemented by inner classes (the `Iterator` case) are the common form; inheritance among inner classes is rare and should stay rare.

## Interview angle

- *"Difference between a static nested class and an inner class?"* An inner class instance holds a reference to an enclosing instance and can use its fields; a static nested class does not and can be created without one.
- *"How do you create an inner class instance from outside?"* `outer.new Inner()`.
- *"Why can inner classes cause memory leaks?"* The hidden `Outer.this` reference keeps the outer object reachable.
- *"Which should you prefer?"* Static nested, unless the enclosing instance is genuinely needed.
- *"Can an inner class have static members?"* Since Java 16, yes; before, only compile-time constants.

## Key takeaways

- Static nested: a class in another's namespace, no outer instance — the default choice.
- Inner: carries `Outer.this`, reads outer fields directly, needs an outer instance, keeps it alive.
- Nested interfaces/enums/records are always static; nested classes may be private.
- `Outer.this.x` reaches the outer field when names shadow; `outer.new Inner()` creates with an explicit outer.
