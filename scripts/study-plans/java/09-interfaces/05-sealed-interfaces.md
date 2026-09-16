---
title: Sealed interfaces — closed sets of types
minutes: 12
---
An ordinary interface is open: anyone, anywhere, can implement it. That is right for `Comparable` and wrong for "the result of a parse is either a success with a value or a failure with a message" — a set of alternatives that is *complete* by design. Java 17's **sealed interfaces** express exactly that: the interface names its permitted implementations, the compiler knows the set is closed, and (with records and pattern matching) Java gains the algebraic data types that functional languages have had for decades.

## Declaring a sealed interface

```java
public sealed interface Shape permits Circle, Square, Triangle { }

public record Circle(double radius) implements Shape { }
public record Square(double side) implements Shape { }
public record Triangle(double base, double height) implements Shape { }
```

Rules:

- `sealed` requires `permits` listing every direct implementor — unless they are all in the same source file, in which case `permits` may be omitted and inferred.
- Each permitted type must directly implement the interface and be `final` (records and enums are implicitly final), `sealed` (continuing the closed hierarchy), or `non-sealed` (reopening that branch to anyone).
- Permitted types must be in the same module, or the same package if in the unnamed module.
- A sealed interface can have everything an interface has: abstract methods, defaults, statics.

Attempting `class Hexagon implements Shape` elsewhere fails: "class is not allowed to extend sealed class".

## Why: exhaustiveness

The compiler now knows every `Shape` is a `Circle`, a `Square` or a `Triangle`. In Java 21 a `switch` with type patterns can prove it has covered them all:

```java
static double area(Shape s) {
    return switch (s) {
        case Circle c   -> Math.PI * c.radius() * c.radius();
        case Square q   -> q.side() * q.side();
        case Triangle t -> 0.5 * t.base() * t.height();
    };                                   // no default — exhaustive, checked by the compiler
}
```

Add a fourth shape and *every* such switch stops compiling until it handles the new case. That is the safety enums provide for constants, extended to types that carry data. On JDK 17–20 (and the JDK 18 runner behind these exercises), pattern switch is a preview feature, so the same logic is written with `instanceof` patterns — the sealing still documents and restricts the hierarchy, and the exhaustive switch arrives with Java 21.

## Modelling alternatives: results, states, expressions

Sealed interfaces plus records model "one of these" data cleanly:

```java
sealed interface ParseResult permits Ok, Err { }
record Ok(int value) implements ParseResult { }
record Err(String message) implements ParseResult { }

static ParseResult parse(String s) {
    try { return new Ok(Integer.parseInt(s)); }
    catch (NumberFormatException e) { return new Err("not a number: " + s); }
}
```

No exceptions for expected failures, no null, no `boolean success` field next to nullable ones — the type says a result is exactly one of two shapes, and the caller must handle both. The same technique models state machines (`Idle | Running | Done | Failed`), expression trees (`Num | Add | Mul`), and events. In interviews, "how would you model a result that can succeed or fail?" is answered with this.

## Sealed classes versus sealed interfaces

`sealed` works on classes too (Module 8), but interfaces are the common choice: records cannot extend classes (they extend `Record`), and records are the natural leaves of a sealed hierarchy. Reach for a sealed *class* only when the alternatives share mutable state or a constructor.

## Interaction with records

Records (Module 10) are final, immutable, with generated `equals`/`hashCode`/`toString` — everything a data-carrying alternative wants. A sealed interface of records is Java's tuple-and-variant type. Java 21 adds *record patterns* to destructure them in a switch: `case Circle(double r) -> …`.

## When *not* to seal

- The set of implementations is genuinely open (plugins, user-defined strategies, `Comparable`).
- Implementations live in other modules you do not control.
- You want the classic OO extensibility: adding a type without touching existing code. Sealing trades that for the other axis — adding an *operation* (a new switch) without touching the types. Pick the axis that changes more often (the "expression problem").

## Reflection and tooling

`Shape.class.isSealed()` and `getPermittedSubclasses()` expose the set at run time; frameworks use them for serialisation of variant types. `non-sealed` shows up in Javadoc as a deliberate reopening — document why.

## Interview angle

- *"What does `sealed` give that `final` and `abstract` do not?"* A *closed but non-empty* set of subtypes the compiler can enumerate — exhaustive switches.
- *"Which modifiers must a permitted subtype have?"* `final`, `sealed` or `non-sealed`.
- *"How do you model success-or-failure without exceptions?"* A sealed interface with `Ok` and `Err` records.
- *"Enums vs sealed types?"* Enums are a fixed set of *instances*; sealed types are a fixed set of *types* whose instances carry data.

## Key takeaways

- `sealed interface X permits A, B, C` closes the set of implementors; each is `final`, `sealed` or `non-sealed`.
- Closed sets enable compiler-checked exhaustive switches (Java 21 pattern switch; `instanceof` chains on JDK 17–20).
- Sealed interface + records = algebraic data types: results, states, expression trees.
- Seal when the alternatives are fixed by design; leave open when extension by others is the point.
