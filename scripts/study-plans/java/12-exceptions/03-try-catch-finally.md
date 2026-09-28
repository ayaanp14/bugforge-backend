---
title: try, catch and finally — the exact semantics
minutes: 14
seo-title: Java Try, Catch and Finally: Does Finally Run After Return?
description: How Java try, catch and finally work: handler order, multi-catch, finally running after return, a return in finally overriding everything, and rethrowing.
question: Does finally run after return in Java?
answer: Yes. In Java a `finally` block runs even when the `try` or `catch` block executes `return`: the return value is computed first, then `finally` runs, then the method returns that value. `finally` is skipped only when the JVM exits through `System.exit`, the thread is killed or the process crashes. A `return` inside `finally` overrides the original one.
q: What happens if finally has a return statement?
a: The `return` in `finally` wins: the method returns that value, and any exception propagating from the `try` or `catch` is silently discarded. The compiler warns that the finally clause cannot complete normally, and reviewers reject it — never return from `finally`.
q: In what order should catch blocks be written?
a: From the most specific type to the most general, because handlers are tried top to bottom and the first match wins. A `catch (IOException e)` above `catch (FileNotFoundException e)` makes the narrower one unreachable, and the compiler rejects it as already caught.
q: What is multi-catch in Java?
a: Multi-catch handles several exception types in one block: `catch (NumberFormatException | DateTimeParseException e)`. The alternatives must not be subclasses of one another, and the parameter `e` is implicitly final. Use it when the handling is identical for every type.
q: What happens when both try and finally throw an exception?
a: The exception thrown in `finally` replaces the one in flight, and the original from the `try` block is lost. The same happens when a `catch` block throws. That loss of the real error is what try-with-resources fixes with suppressed exceptions.
q: Is a try block expensive in Java?
a: No. Entering a `try` costs nothing, because the JVM records handler ranges in a table. The cost is in throwing: constructing the exception walks the stack to fill in its trace, and then the stack unwinds. Code that never throws pays nothing.
---
`try`/`catch`/`finally` looks simple and has several precise rules that interviewers probe: the order handlers are tried, what `finally` does to a `return`, what happens when both `catch` and `finally` throw, and how multi-catch and rethrow interact with the type system. This lesson pins down each rule with the smallest example that demonstrates it.

## The shape

```java
try {
    risky();                       // the guarded block
} catch (FileNotFoundException e) {   // handlers, tried in order; first match wins
    …
} catch (IOException e) {          // a broader type AFTER the narrower one
    …
} finally {
    cleanup();                     // runs whether or not an exception occurred
}
```

At least one `catch` or a `finally` is required. When an exception is thrown inside the `try`, execution jumps to the first `catch` whose type is the exception's class or a superclass; the rest of the `try` block is skipped. If no `catch` matches, `finally` runs and the exception continues up the stack.

## Handler order

Handlers are checked top to bottom, and the first match wins, so a **broad type above a narrow one makes the narrow one unreachable** — and the compiler says so: "exception FileNotFoundException has already been caught". Order from most specific to most general.

## Multi-catch

```java
try {
    parseAndStore(input);
} catch (NumberFormatException | DateTimeParseException e) {    // one handler, several unrelated types
    log("bad input: " + e.getMessage());
}
```

The alternatives must not be subclasses of each other (`IOException | FileNotFoundException` is an error), and the parameter `e` is implicitly `final` — its static type is the nearest common supertype. Use multi-catch when the handling is identical; separate handlers when it differs.

## `finally`: always, with three exceptions

`finally` runs when the `try` block completes normally, when it throws, when a `catch` throws, and when either block executes `return`, `break` or `continue`. It does **not** run if the JVM exits (`System.exit`), the thread is killed, or the process crashes. Its purpose is cleanup that must happen regardless: closing, unlocking, restoring state. (For closing `AutoCloseable` resources, try-with-resources is better — next lesson.)

## `finally` and `return`

```java
static int f() {
    try {
        return 1;
    } finally {
        System.out.println("finally");     // prints, then 1 is returned
    }
}

static int g() {
    try {
        return 1;
    } finally {
        return 2;                          // OVERRIDES: g() returns 2, and any pending exception is DISCARDED
    }
}

static int h() {
    int x = 1;
    try {
        return x;                          // the value 1 is captured here…
    } finally {
        x = 2;                             // …so this change is not seen; h() returns 1
    }
}
```

A `return` (or `throw`) in `finally` replaces whatever the `try`/`catch` was about to do, including silently swallowing an exception — the compiler warns ("finally clause cannot complete normally") and code reviewers reject it. Never `return` from `finally`. Note also that `return x` evaluates `x` *before* `finally` runs.

## When both throw

```java
try {
    throw new IllegalStateException("from try");
} finally {
    throw new RuntimeException("from finally");    // this one propagates; "from try" is lost
}
```

An exception thrown in `finally` (or in a `catch`) replaces the one in flight. This is how cleanup code hides the real error — the motivation for try-with-resources' *suppressed* exceptions.

## Rethrowing

```java
catch (IOException e) {
    log(e);
    throw e;                                  // rethrow the same object: original stack trace preserved
}
catch (IOException e) {
    throw new ServiceException("load failed", e);     // wrap with cause: both traces available
}
catch (Exception e) {
    throw e;         // Java 7+ "precise rethrow": if the try only throws IOException, this compiles as throws IOException
}
```

`throw e` keeps the original trace (the trace was captured at construction). Wrapping adds context and translates the type for callers; always pass the cause. Precise rethrow lets a `catch (Exception e) { … throw e; }` declare only the checked types the `try` block can actually throw, as long as `e` is not reassigned.

## Scope of the `catch` parameter

`e` is local to its handler. A variable declared in the `try` block is **not** visible in `catch` or `finally` — declare it before the `try` if the handler needs it:

```java
Connection c = null;
try {
    c = open();
    …
} finally {
    if (c != null) c.close();
}
```

## Nested `try` and the flow

A `try` inside a `catch` or `finally` is legal and sometimes needed (closing in `finally` can itself throw). Keep nesting shallow; extract a method when it grows. An exception thrown in a `catch` block is *not* caught by sibling `catch` blocks of the same `try` — only by an enclosing `try`.

## `try` without `catch`

`try { … } finally { … }` is common: run cleanup, let exceptions pass through untouched. It expresses "I am not handling this, I am just tidying up" and is preferable to `catch (Exception e) { cleanup(); throw e; }`.

## Cost

Entering a `try` block is free — the JVM records handler ranges in a table; there is no per-entry work. What costs is *throwing*: constructing the exception (stack walk) and unwinding. Code that never throws pays nothing for the `try`.

## Interview angle

- *"Does `finally` run after `return`?"* Yes. The return value is computed first, then `finally` runs, then the method returns.
- *"What if `finally` also returns?"* Its return wins and any exception is discarded — never do it.
- *"Order of catch blocks?"* Specific before general; the compiler rejects an unreachable handler.
- *"When does `finally` not run?"* `System.exit`, JVM crash, thread death.
- *"Multi-catch restrictions?"* Types must not be related by inheritance; the parameter is final.

## Key takeaways

- Handlers are tried top to bottom; first match wins; narrow before broad.
- `finally` always runs (except on JVM exit) — after the return value is computed; a `return`/`throw` in `finally` overrides and hides everything.
- An exception from `catch`/`finally` replaces the one in flight — the reason try-with-resources exists.
- Rethrow the same object to keep the trace; wrap with a cause to add context.
- `try`/`finally` without `catch` for cleanup that does not handle.
