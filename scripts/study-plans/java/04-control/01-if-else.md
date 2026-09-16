---
title: if, else and the shape of a decision
minutes: 12
---
`if` is the first control-flow statement everyone learns and the one whose *style* most affects whether code can be read. This lesson covers the semantics precisely — including the dangling `else` and the boolean rules — and then the conventions that turn a nest of conditions into something a reviewer can follow: guard clauses, early returns, and expressing conditions as boolean values rather than branches.

## The statement

```java
if (condition) statement
if (condition) statement else statement
```

`condition` must be a `boolean` expression — not an `int`, not an object, not a `String`. `if (count)` is a compile error; write `if (count != 0)`. `if (name)` is an error; `if (name != null)` or `if (!name.isEmpty())`. This is deliberate: C's "any non-zero value is true" hides bugs like `if (x = 5)`, which in Java does not compile because `x = 5` is an `int`. (`if (flag = true)` *does* compile, since the assignment yields a `boolean`, and is a famous bug; write `if (flag)`.)

The body is a single statement, which is why braces exist:

```java
if (x > 0)
    System.out.println("positive");
    total += x;             // NOT inside the if — indentation lies; the compiler ignores it
```

Always use braces, even for one line. Apple's "goto fail" SSL bug was exactly this shape. The only accepted exception in some codebases is a one-line guard `if (x == null) return;` on a single line.

## `else if` chains

```java
if (score >= 90) {
    grade = 'A';
} else if (score >= 80) {
    grade = 'B';
} else if (score >= 70) {
    grade = 'C';
} else {
    grade = 'F';
}
```

There is no `elif` keyword; `else if` is an `else` whose statement happens to be another `if`. The conditions are tested top to bottom and the **first true one wins**, so order matters: testing `score >= 70` first would never let `A` or `B` happen. When the ranges are exhaustive, end with a plain `else`; when a branch should be impossible, throw (`throw new IllegalStateException("unreachable: " + score)`) rather than silently doing nothing.

## The dangling `else`

```java
if (a)
    if (b)
        x();
else                // which if does this belong to?
    y();
```

Java binds an `else` to the **nearest** unmatched `if` — so this `else` belongs to `if (b)`, whatever the indentation says. Braces remove the ambiguity, which is the third reason to always use them.

## Conditions are values

A condition is just a `boolean` expression, and boolean expressions can be named, returned and stored:

```java
// verbose
if (age >= 18) {
    return true;
} else {
    return false;
}
// direct
return age >= 18;

// verbose
boolean valid;
if (name != null && !name.isEmpty()) valid = true; else valid = false;
// direct
boolean valid = name != null && !name.isEmpty();

// naming a condition
boolean isWeekend = day == SATURDAY || day == SUNDAY;
boolean isHoliday = holidays.contains(date);
if (isWeekend || isHoliday) { … }
```

Comparing a boolean to `true` (`if (flag == true)`) is redundant and, with a `Boolean` wrapper, unboxes and can throw; write `if (flag)` and `if (!flag)`.

## Guard clauses and early return

Nested conditions grow rightward until the happy path is buried:

```java
void process(Order order) {
    if (order != null) {
        if (order.isPaid()) {
            if (!order.isShipped()) {
                ship(order);
            }
        }
    }
}
```

Invert each condition, handle the exceptional case, and leave:

```java
void process(Order order) {
    if (order == null) return;
    if (!order.isPaid()) return;
    if (order.isShipped()) return;
    ship(order);
}
```

Same behaviour, no nesting; each line states one precondition. Throwing from a guard (`throw new IllegalArgumentException("order is null")`) is the variant for cases that should never happen. Interviewers notice guard clauses; so do code reviewers.

## The ternary operator, as a conditional expression

For choosing a *value*, `?:` is often clearer than an `if` that assigns in both branches:

```java
String label = count == 1 ? "item" : "items";
int max = a > b ? a : b;          // or Math.max(a, b)
```

Nest at most once, and never use it for side effects (`cond ? doA() : doB();` is legal and unreadable).

## Short-circuit ordering for safety

Because `&&` and `||` stop early, the *order* of conditions is a correctness tool:

```java
if (s != null && s.length() > 3) …     // safe
if (s.length() > 3 && s != null) …     // NullPointerException when s is null
if (i < arr.length && arr[i] == target) …   // bounds check first
```

Put the cheap, protective check first; the expensive or dangerous one second.

## Comparing objects in conditions

`==` on references is identity. `if (name == "admin")` compiles and is wrong; `if ("admin".equals(name))`. For enums, `==` is correct and preferred (Module 10). For wrappers, `equals` or unbox. For `null` checks, only `==`/`!=` work.

## Pattern matching for `instanceof` (Java 16+)

```java
if (shape instanceof Circle c && c.radius() > 1) {
    System.out.println("big circle " + c.radius());
}
```

The test and the cast happen together; `c` is in scope where the condition is true — including after a guard clause `if (!(obj instanceof String s)) return;` where `s` is in scope for the rest of the method. Module 8 covers it with inheritance.

## Style checklist

- Braces always; one statement per line.
- Positive conditions where possible: `if (isReady)` rather than `if (!isNotReady)`.
- Avoid `else` after a `return`/`throw`/`continue` — the `else` is implied.
- Extract complex conditions into well-named booleans or methods (`isEligible(user)`).
- Order `else if` chains from most specific to most general, and make the ranges obviously exhaustive.
- Prefer `switch` (next lesson) when comparing one value against many constants.

## Interview angle

- *"`if (x = 5)` — what happens?"* Compile error: an `int` is not a `boolean`. *"`if (flag = true)`?"* Compiles, assigns, always true.
- *"Which `if` does a dangling `else` bind to?"* The nearest one.
- *"Why `"admin".equals(name)` rather than `name.equals("admin")`?"* Null safety.

## Key takeaways

- The condition must be a `boolean`; nothing converts to one.
- Braces always — indentation is not structure, and `else` binds to the nearest `if`.
- Conditions are values: return them, name them, combine them.
- Guard clauses flatten nesting; order short-circuit conditions for safety.
