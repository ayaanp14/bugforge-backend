---
title: Designing a class — cohesion, composition and toString
minutes: 13
seo-title: Designing a Class in Java: Cohesion, Composition and toString
description: Good Java class design: one concept per class, composition, value objects versus entities, overriding toString, the object lifecycle and the builder pattern.
question: How do you design a good class in Java?
answer: A well-designed Java class models one concept you can describe in a sentence without "and". Decide first whether it is a value (immutable, equal by content) or an entity (identified by an id, with a lifecycle); keep its fields private and ideally `final`; enforce invariants in the constructor; receive collaborators through the constructor; and override `toString` straight away.
q: Why should you override toString in Java?
a: The inherited `Object.toString()` returns the class name and a hash, such as `Order@1b6d3586`, which is useless in logs, debuggers and `println`. Override it with `@Override` so a typo becomes a compile error, include the identifying fields on one line, and leave secrets out.
q: What is the builder pattern in Java?
a: The builder pattern constructs an object with many optional parts readably: a static nested `Builder` class has one fluent method per option returning `this`, and `build()` validates and calls the class's private constructor. It suits four or more optional parameters; `StringBuilder` and `HttpRequest.newBuilder()` follow the pattern.
q: What is the difference between a value object and an entity?
a: A value object, such as `Money` or `LocalDate`, is identified by its content, is immutable, and bases `equals` and `hashCode` on all its fields. An entity, such as a `Customer` or an `Order`, is identified by an id, usually changes over its lifecycle, and bases equality on that id.
q: Does Java have destructors?
a: No. An object lives while a reference from a GC root reaches it, and the garbage collector reclaims it at a time of its choosing; `System.gc()` is only a hint and `finalize()` is deprecated for removal. Resources such as files and sockets are released by `close()`, usually through try-with-resources.
q: What is composition in Java?
a: Composition means building a class from other objects it holds as fields — an `Order` has a `Customer` and a list of order lines and delegates work to them. It is a has-a relationship, preferred over inheritance because it hides the inner object's API and can change at run time.
---
Knowing the syntax of classes is not the same as knowing what to put in one. This lesson is about the design choices: what belongs together, how objects hold other objects (composition), values versus entities, the first `Object` method you override (`toString`), and the object lifecycle from `new` to garbage collection. It also names the builder, the pattern for objects with many optional parts.

## Cohesion: one reason to change

A class should model one concept, and everything in it should be about that concept. `Order` holds lines, a customer reference and a status, and knows how to compute its total and whether it can be cancelled. It does not know how to format itself as HTML, send email, or talk to a database — those are other classes' jobs. The test: describe the class in one sentence without "and". A class that keeps growing methods for unrelated callers is two classes.

The mirror rule — **don't repeat yourself** — says the *same* concept should live in one place. If three classes each compute a shipping cost, there is a `ShippingPolicy` waiting to exist.

## Composition: objects made of objects

```java
public class Order {
    private final Customer customer;                 // has-a
    private final List<OrderLine> lines = new ArrayList<>();
    private Status status = Status.OPEN;

    public void add(Product p, int qty) { lines.add(new OrderLine(p, qty)); }
    public long totalCents() {
        long sum = 0;
        for (OrderLine l : lines) sum += l.subtotalCents();
        return sum;
    }
}
```

An `Order` *has* a customer and lines; it delegates the subtotal of each line to the `OrderLine`. Composition is the primary way to build larger behaviour from smaller pieces, and it is what "favour composition over inheritance" (Module 8) points at: a `Stack` that *has* a list is more robust than one that *is* a list.

Wiring: pass collaborators in through the constructor (`new Order(customer)`), not by creating them inside from global state — that keeps the class testable and its dependencies visible.

## Values versus entities

| | Value object | Entity |
| --- | --- | --- |
| Identity | by content — two `Money(5, "EUR")` are the same | by id — two customers named "Ada" are different |
| Mutability | immutable | usually mutable, with lifecycle |
| `equals`/`hashCode` | on all fields | on the id |
| Examples | `Money`, `Point`, `LocalDate`, `Range`, `Email` | `Customer`, `Order`, `Session`, `Connection` |

Deciding which you are writing settles most other questions: values get `final` fields, no setters and full-field equality (records do all of this — Module 10); entities get an id, behavioural methods and equality on the id.

## `toString`

Every class inherits `Object.toString()`, which returns `ClassName@1b6d3586` — the class and a hash. Override it the moment a class exists, because it is what appears in `println`, string concatenation, debuggers and logs:

```java
@Override
public String toString() {
    return "Order[" + id + ", " + customer.name() + ", " + lines.size() + " lines, " + status + "]";
}
```

Conventions: include the fields that identify and describe the object; keep it one line; do not include secrets (passwords, tokens); do not make callers parse it — provide accessors for data. `@Override` is mandatory practice: it makes a typo (`toSting`) a compile error instead of a silent new method. `equals` and `hashCode`, the other two you will override, are Module 8's subject.

## The object lifecycle

1. **`new`**: memory allocated on the heap, fields defaulted, constructor run.
2. **Use**: references passed around; the object lives while any reference reaches it from a *GC root* (a local on some stack, a static field, a thread).
3. **Unreachable**: the last reference is dropped — a local goes out of scope, a field is nulled, a collection removes it.
4. **Collected**: the garbage collector reclaims the memory at a time of its choosing. You cannot force it (`System.gc()` is a hint) and you cannot observe it reliably.

There are **no destructors**. `finalize()` existed and is deprecated for removal — it ran at an unpredictable time, once, and could resurrect objects. For resources that must be released deterministically (files, sockets, locks), the object implements `AutoCloseable` and callers use `try`-with-resources (Module 12). Memory is the GC's job; everything else is `close()`'s.

## Builders for many-part objects

When a constructor would need six parameters, four of them optional, a telescoping set of constructors becomes unreadable and a "setter everything" object breaks immutability. The **builder** pattern separates assembly from the immutable result:

```java
Pizza p = new Pizza.Builder(Size.LARGE)
    .cheese()
    .topping("olives")
    .topping("basil")
    .build();
```

`Builder` is a static nested class with a fluent setter per option returning `this`, and a `build()` that validates and calls the private `Pizza` constructor. `StringBuilder` and `HttpRequest.newBuilder()` are the pattern in the JDK. Use it at four-plus optional parameters; below that, overloaded constructors or static factories suffice.

## Class layout conventions

Order inside a class, top to bottom: constants → static fields → instance fields → constructors → static factories → public methods → private helpers → `equals`/`hashCode`/`toString`. One top-level public class per file, named for it. Keep fields at the top so a reader learns the state before the behaviour.

## A checklist for a new class

- What concept is this? One sentence, no "and".
- Value or entity? Decide equality and mutability accordingly.
- What are the invariants? Enforce them in the constructor and every mutator.
- Which fields are `final`? Ideally all, for a value.
- What is `private`? Everything but the API.
- Does it hold mutable objects? Copy in, copy out, or make them immutable.
- `toString` written? `@Override` on it?
- Could a caller ever see a half-built or inconsistent object? Then fix the constructor.

## Interview angle

- *"Composition vs inheritance?"* Has-a vs is-a; prefer has-a — it hides the inner object's API and can change at run time.
- *"How does Java free memory?"* Garbage collection of unreachable objects; no destructors; `close()` for resources.
- *"Why override `toString`?"* Debuggability: default output is `Class@hash`.
- *"What is the builder pattern for?"* Constructing immutable objects with many optional parameters readably.

## Key takeaways

- One concept per class; compose larger behaviour from smaller objects passed in through constructors.
- Decide value vs entity first — it settles equality, mutability and design.
- Override `toString` immediately, with `@Override`; keep secrets out of it.
- Objects live while reachable and die when the GC says; resources are closed explicitly, never finalised.
- Builders for many optional parts; static factories and overloads for few.
