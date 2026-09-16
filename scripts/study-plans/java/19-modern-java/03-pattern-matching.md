---
title: Pattern matching — instanceof, switch and record patterns
minutes: 15
---
Pattern matching is the biggest change to how Java code *reads* since lambdas. It began quietly in Java 16 — `if (o instanceof String s)` binds `s` without a cast — and by Java 21 it lets a `switch` take a value of a sealed type apart by shape, down through nested records, with the compiler checking that every case is covered. The result is that the "sum type + function by cases" style of functional languages is now idiomatic Java, and the visitor pattern is mostly retired. This lesson covers all three pieces, what compiles on the runtime you have (Java 17-level: `instanceof` patterns, records, sealed types) and what needs 21 (pattern `switch`, record patterns), and the exhaustiveness rule that makes it safe.

## Pattern `instanceof` (Java 16)

```java
// before
if (o instanceof String) { String s = (String) o; use(s.length()); }
// after
if (o instanceof String s) { use(s.length()); }
if (o instanceof String s && s.length() > 3) { … }          // s is in scope on the right of &&
if (!(o instanceof String s)) return;                        // flow scoping: s is in scope AFTER this line
use(s);
```

The **type pattern** `String s` tests and binds in one step. Scope follows *definite matching*: `s` exists wherever the compiler can prove the test succeeded — the `if` body, the right of `&&`, and after an early return on the negated test. It does **not** exist on the right of `||`, and a pattern variable may shadow a field but not a local. The cast is gone, and with it the `ClassCastException` you get when the check and the cast drift apart during a refactor.

## Sealed types set up the switch

Recall from the interfaces module: a `sealed interface Shape permits Circle, Square, Rect` fixes the set of implementations. That fixed set is what lets a switch over it be **exhaustive** without a `default`. Until pattern `switch` arrived, the way to dispatch on a sealed hierarchy was a chain of pattern `instanceof`s — still the form you write on Java 17:

```java
sealed interface Shape permits Circle, Square, Rect {}
record Circle(double r) implements Shape {}
record Square(double side) implements Shape {}
record Rect(double w, double h) implements Shape {}

static double area(Shape s) {
    if (s instanceof Circle c) return Math.PI * c.r() * c.r();
    if (s instanceof Square q) return q.side() * q.side();
    if (s instanceof Rect r) return r.w() * r.h();
    throw new IllegalStateException("unreachable: " + s);      // the compiler cannot see exhaustiveness in an if-chain
}
```

## Pattern matching for `switch` (Java 21)

```java
static double area(Shape s) {
    return switch (s) {
        case Circle c -> Math.PI * c.r() * c.r();
        case Square q -> q.side() * q.side();
        case Rect r   -> r.w() * r.h();
    };                                            // no default: the compiler proves every permitted subtype is covered
}
```

What changed: `case` may be a **type pattern**; the selector may be any reference type (not just primitives, strings and enums); the switch is checked for **exhaustiveness** — for a sealed type it must cover every permitted subtype (or have a `default`); and cases are checked for **dominance** — a `case Object o` before `case String s` is a compile error because it would swallow it. Add a subtype to `Shape` and every exhaustive switch in the codebase fails to compile until it handles the new case. That is the safety the visitor pattern promised and delivered only with boilerplate.

**Guards** refine a case with `when`:

```java
case Circle c when c.r() == 0 -> 0;
case Circle c -> Math.PI * c.r() * c.r();
```

**`null`** can be a case — `case null -> …` — or `case null, default ->`; a switch without it throws `NullPointerException` on a null selector, as switches always have.

## Record patterns (Java 21)

A record pattern deconstructs a record into its components, and nests:

```java
record Point(int x, int y) {}
record Line(Point from, Point to) {}

if (o instanceof Point(int x, int y)) System.out.println(x + y);
static String describe(Object o) {
    return switch (o) {
        case Line(Point(var x1, var y1), Point(var x2, var y2)) when x1 == x2 -> "vertical";
        case Line(Point from, Point to) -> "line";
        case Point(int x, int y) when x == 0 && y == 0 -> "origin";
        case Point p -> "point";
        default -> "other";
    };
}
```

`var` is allowed for component types. Nesting goes as deep as the data does, and the compiler checks that the components exist and are compatible. Java 22 adds `_` for components you do not need (`case Point(int x, _)`). Records + sealed interfaces + pattern switch is the trio: **algebraic data types with exhaustive matching**, and it is how modern Java models results (`Ok`/`Err`), commands, AST nodes and states.

## Where this replaces old idioms

| Old | New |
| --- | --- |
| `instanceof` + cast | pattern `instanceof` |
| visitor pattern over a hierarchy | sealed + exhaustive pattern `switch` |
| chain of `if (x instanceof …)` | pattern `switch` with dominance and exhaustiveness checks |
| `equals`-based `switch` on a "type" string field | switch on the actual type |
| getters to unpack a data object | record pattern |

The visitor is not dead — it still allows adding operations without touching the hierarchy's *definition* module — but for code that owns both the types and the operations, patterns win on every axis.

## Compiler guarantees, summarised

- **Exhaustiveness**: a switch expression must cover all cases; over a sealed type, every permitted subtype (recursively for sealed subtypes); over an enum, every constant; otherwise a `default` is required. A switch *statement* with patterns must also be exhaustive (older statement switches on enums need not be).
- **Dominance**: an earlier case may not dominate a later one; unguarded type patterns come after guarded ones for the same type.
- **Scope**: pattern variables are definitely assigned only where the match is proven.
- **Separate compilation**: if a sealed hierarchy changes and a switch is not recompiled, the JVM throws `MatchException` at run time — the compile-time promise degrades gracefully.

## Interview angle

- *"What does `if (o instanceof String s)` do?"* Tests and binds in one; `s` is scoped where the match is definite; no cast.
- *"What does sealed buy you with `switch`?"* Exhaustiveness without `default`: adding a subtype breaks every switch that forgets it.
- *"Pattern `switch` versus visitor?"* Same exhaustiveness guarantee, no boilerplate, but operations live with the types; visitor still allows extension across modules.
- *"What is a record pattern?"* Deconstructing a record into components in a `case` or `instanceof`, nestable.
- *"What happens on `switch (null)`?"* `NullPointerException` unless there is a `case null`.

## Key takeaways

- Pattern `instanceof` (16): test + bind, flow-scoped, no cast; on Java 17 an `if`-chain is how you dispatch over a sealed type.
- Pattern `switch` (21): type patterns as cases, `when` guards, `case null`, exhaustiveness and dominance checked by the compiler.
- Record patterns (21) deconstruct, nest, and take `var`; sealed + records + switch = algebraic data types.
- Exhaustive switches turn "I added a subtype" into compile errors at every site that must change.
- Prefer patterns to visitors when you own both the hierarchy and the operations.
