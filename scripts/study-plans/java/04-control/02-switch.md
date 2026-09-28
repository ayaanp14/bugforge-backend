---
title: switch — statements, expressions and arrows
minutes: 15
seo-title: Java Switch Statement vs Switch Expression: Arrow Syntax
description: A Java switch compares one value against constants. Classic fall-through, the arrow form that never falls through, and switch expressions that yield a value.
question: What is a switch expression in Java?
answer: A switch expression in Java, standard since Java 14, is a `switch` that produces a value: `String kind = switch (day) { case 6, 7 -> "weekend"; default -> "weekday"; };`. Its arrow branches never fall through, a block branch gives its value with `yield`, and it must be exhaustive, covering every possible value with its cases or a `default`.
q: What is fall-through in a Java switch?
a: In the classic colon form, execution jumps to the matching `case` label and keeps running downward through the following cases until a `break`. Forgetting a `break` runs the next case's code too. The arrow form, `case 1 ->`, never falls through.
q: What types can be used in a switch in Java?
a: The selector can be a `byte`, `short`, `char` or `int`, their wrapper classes, a `String` since Java 7, or an `enum`. A `long`, `float`, `double` or `boolean` is not allowed, and case labels must be unique compile-time constants. Java 21 adds pattern matching on any reference type.
q: What does yield do in a Java switch?
a: `yield` gives the value of a block inside a switch expression: `default -> { log("long month"); yield 31; }`. It is needed only in blocks, since an arrow branch with a single expression yields that expression directly, and `yield` is a contextual keyword rather than a reserved word.
q: What happens when you switch on a null String in Java?
a: It throws a `NullPointerException`, and so does a `null` enum selector. Check for `null` with an `if` before the switch, or, from Java 21, add an explicit `case null` branch.
q: When should I use switch instead of if-else in Java?
a: Use `switch` when one value is compared against several constants: it reads more clearly and the compiler can dispatch through a jump table. Use `if` for ranges such as `score >= 90`, for conditions on several variables and for comparisons with values that are not constants.
---
`switch` compares one value against a list of constants. It has existed since Java 1.0 in a form inherited from C — with fall-through, the bug generator — and was reworked in Java 14 into a cleaner **arrow form** and a **switch expression** that yields a value. Modern Java code uses the new forms almost exclusively, but you will read the old one in every codebase, so both are here.

## The classic statement (with fall-through)

```java
switch (day) {
    case 1:
        System.out.println("Monday");
        break;
    case 6:
    case 7:
        System.out.println("Weekend");
        break;
    default:
        System.out.println("Midweek");
}
```

Execution jumps to the matching `case` label and then **runs downward until a `break`** — through following `case` labels if there is no `break`. That is *fall-through*, and it is what makes `case 6: case 7:` share a body. It is also the source of the classic bug: forget a `break` and the next case's code runs too. Compilers warn about it (`-Xlint:fallthrough`); reviewers reject it unless there is a `// fall through` comment.

The selector can be `byte`, `short`, `char`, `int` (and their wrappers), `String` (Java 7), or an `enum`. Not `long`, not `boolean`, not `double`. Case labels must be **compile-time constants** and unique. `default` can go anywhere but conventionally goes last.

## The arrow form (Java 14+)

```java
switch (day) {
    case 1 -> System.out.println("Monday");
    case 6, 7 -> System.out.println("Weekend");
    default -> System.out.println("Midweek");
}
```

`->` replaces `:` and there is **no fall-through**: exactly one branch runs. Multiple labels are separated by commas. A branch body is a single expression, a block `{ … }`, or a `throw`. Mixing arrow and colon forms in one `switch` is a compile error.

## Switch expressions

A `switch` can produce a value:

```java
String kind = switch (day) {
    case 1, 2, 3, 4, 5 -> "weekday";
    case 6, 7 -> "weekend";
    default -> throw new IllegalArgumentException("day " + day);
};

int days = switch (month) {
    case 2 -> leap ? 29 : 28;
    case 4, 6, 9, 11 -> 30;
    default -> {
        log("long month");
        yield 31;            // a block yields its value
    }
};
```

Rules:

- The expression must be **exhaustive**: for an `int` or `String` selector that means a `default`; for an enum, covering every constant is enough (a `default` is then optional — and omitting it means adding a constant later is a compile error where you switch, which is usually what you want).
- Each branch yields a value of a common type; `yield` is used inside a block. (`yield` is a contextual keyword — `return` would be wrong here.)
- It ends with a semicolon, because it is an expression statement.
- Colon-form cases can be used in an expression too (`case 1: yield "x";`) but nobody should.

Switch expressions make many `if/else` chains disappear and, because they are expressions, they can initialise a `final` variable in one step.

## Strings and enums

```java
switch (command.toLowerCase(Locale.ROOT)) {
    case "start", "run" -> start();
    case "stop" -> stop();
    default -> unknown(command);
}

enum Level { LOW, MEDIUM, HIGH }
switch (level) {
    case LOW -> …;          // constants are written unqualified: LOW, not Level.LOW
    case MEDIUM, HIGH -> …;
}
```

A `String` switch compares with `equals` after a `hashCode` dispatch — case-sensitive, and `null` throws `NullPointerException`. So does a null enum. Guard with an `if` before the switch (or `case null` in Java 21).

## Scope inside a classic switch

The whole colon-form `switch` body is **one block**, so a variable declared in one `case` is in scope in later cases — but only *initialised* if that case ran:

```java
switch (x) {
    case 1:
        int y = 10;
        break;
    case 2:
        y = 20;          // legal: same scope; y declared above
        System.out.println(y);
        break;
    case 3:
        System.out.println(y);   // compile error: y might not have been initialized
}
```

Wrap a case's body in braces to give it its own scope. The arrow form has no such issue — each branch is its own scope.

## Choosing between `if` and `switch`

Use `switch` when one value is compared against several constants — it is clearer, and the compiler can dispatch with a jump table (`tableswitch`) or binary search (`lookupswitch`) rather than a chain of comparisons. Use `if` for ranges (`score >= 90`), for conditions on several variables, or when comparing non-constants. A `switch` on a `boolean` does not exist; that is an `if`.

## Pattern matching for switch (Java 21)

Java 21 lets a `switch` test *types* and *patterns*, with guards:

```java
String describe(Object o) {
    return switch (o) {
        case null -> "null";
        case Integer i when i > 100 -> "big int";
        case Integer i -> "int " + i;
        case String s -> "string of " + s.length();
        default -> "something else";
    };
}
```

And with sealed hierarchies (Module 9) the compiler checks exhaustiveness without a `default`. This is the direction the language is going. The runner behind these exercises is JDK 18, where this form is a preview feature, so the exercises stay with constants; the Modern Java module covers patterns in depth.

## Common mistakes

| Mistake | Effect |
| --- | --- |
| Missing `break` in colon form | Falls through into the next case |
| Duplicate case labels | Compile error |
| `case` with a variable | Compile error: needs a constant |
| Switch on `long`/`double` | Compile error |
| `null` selector | `NullPointerException` |
| Non-exhaustive switch expression | Compile error |
| `return` instead of `yield` in a block | Compile error — `return` cannot jump out of a switch expression; `yield` the value |

## Interview angle

- *"What is fall-through?"* Colon-form cases continue into the next case without `break`.
- *"Which types can a switch select on?"* Integral primitives up to `int`, their wrappers, `char`, `String`, enums (and, from Java 21, any reference type via patterns).
- *"Difference between switch statement and expression?"* The expression yields a value and must be exhaustive.
- *"What happens with a `null` string in a switch?"* `NullPointerException`.

## Key takeaways

- Colon `case` falls through; arrow `case ->` does not. Prefer arrows.
- A switch expression yields a value with `->` or `yield`, and must be exhaustive.
- Selectors: `int`-sized integrals, `char`, `String`, enums; labels are constants; `null` throws.
- Enum switches covering every constant need no `default` — and then fail to compile when a constant is added, on purpose.
- Java 21 adds type and guard patterns; the runner here is JDK 18.
