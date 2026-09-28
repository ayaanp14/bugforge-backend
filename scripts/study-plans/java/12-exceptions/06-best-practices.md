---
title: Exception handling that survives production
minutes: 13
seo-title: Java Exception Handling Best Practices for Production Code
description: Java exception handling best practices: never swallow, catch the narrowest type, log once, keep the cause, fail fast, and no exceptions for control flow.
question: What are the best practices for exception handling in Java?
answer: The core Java exception handling best practices are: never swallow an exception with an empty `catch`; catch the narrowest type you can actually handle; log an exception once, where it is handled, and otherwise wrap it with its cause or let it propagate; validate arguments and fail fast; keep `try` blocks small; and never use exceptions for ordinary control flow.
q: Why is an empty catch block bad?
a: It turns a failure into silent data loss: the program carries on in a broken state and nothing records what went wrong. If ignoring an exception is genuinely intended, catch the narrowest type and say so in a comment; otherwise handle it or let it propagate.
q: Why should you not catch Exception in Java?
a: `catch (Exception e)` also catches `NullPointerException`, `ClassCastException` and every other bug, so programming errors are treated as recoverable failures and get retried or ignored. Catch the specific type you can handle, and let bugs crash loudly so they are fixed.
q: Should you log and rethrow an exception?
a: No. Every layer that logs and rethrows prints another copy of the same trace, turning one failure into pages of logs. Log once, where the exception is actually handled; everywhere else, wrap it with the cause or let it pass.
q: Why not use exceptions for control flow in Java?
a: Throwing is expensive, since constructing an exception walks the stack, and exceptions in normal flow hide the real exceptions of the same type. Test conditions you can test, such as `i < array.length`; catching is fine only when the API offers nothing else, as with `Integer.parseInt`.
q: Are assertions enabled by default in Java?
a: No. `assert` statements run only when the JVM is started with `-ea`, so they must never validate user input or method arguments — use an `if` and `IllegalArgumentException` for that. Assertions check internal invariants during tests and development.
---
The syntax of exceptions is a day's work; the judgement takes longer. Most exception bugs in real systems are not syntax — they are swallowed failures, exceptions used as `if` statements, `catch (Exception e)` hiding a `NullPointerException`, and logs that say "error" with no context. This lesson is the set of practices that experienced Java teams enforce in review, each with the failure it prevents.

## 1. Never swallow

```java
try { save(order); } catch (Exception e) { }                    // the order was not saved, and nobody will ever know
try { save(order); } catch (Exception e) { e.printStackTrace(); }   // stderr, no context, no handling — nearly as bad
```

An empty `catch` turns a failure into silent data loss. If you genuinely intend to ignore an exception (closing a stream you no longer care about), say so with a comment and catch the narrowest type. Otherwise handle it, or let it propagate.

## 2. Catch the narrowest type you can handle

`catch (Exception e)` catches `NullPointerException`, `ClassCastException` and every other bug along with the `IOException` you meant. Bugs then look like transient failures and get retried or ignored. Catch `IOException`; let the bugs crash loudly so they get fixed. `catch (Throwable t)` catches `OutOfMemoryError` too — reserve it for a thread's top-level loop that must not die, and rethrow `Error`s even there.

## 3. Log **or** rethrow — not both

```java
catch (IOException e) {
    log.error("load failed", e);
    throw new LoadException("load failed", e);      // now the same failure is logged at every layer that catches it
}
```

Each layer that logs and rethrows produces another copy of the trace; a single failure becomes five pages. Decide where the exception is *handled* and log there, once, with the cause. Everywhere else, wrap (with cause) or let it pass.

## 4. Do not use exceptions for control flow

```java
try { return Integer.parseInt(s); } catch (NumberFormatException e) { return -1; }   // acceptable: parseInt offers no check
try { return array[i]; } catch (ArrayIndexOutOfBoundsException e) { return null; }  // wrong: check i < array.length
```

Throwing is expensive (a stack walk per construction) and, more importantly, an exception in normal flow hides the *real* exceptions of that type. Test conditions you can test; use exceptions for the exceptional. When an API gives you only a throwing form (`parseInt`), catching the specific exception is fine.

## 5. Fail fast, at the boundary

Validate arguments at the top of public methods and constructors and throw `IllegalArgumentException`/`NullPointerException` immediately. A bad value that travels through six calls before exploding is far harder to diagnose than one rejected at the door. `Objects.requireNonNull(x, "x")` is the one-liner.

## 6. Preserve the cause and add context

`throw new ServiceException("saving order " + id + " for customer " + customerId, e)` — the message says what was being attempted with which data; the cause says why it failed. A wrapped exception without a cause deletes the only useful stack trace; a message without context makes the trace the only clue.

## 7. Keep `try` blocks small

A `try` around fifty lines with one `catch (Exception e)` at the end tells nobody which of the fifty lines failed or which failures were anticipated. Wrap the one call that can throw; handle that; move on. If several calls throw different things, that is several small `try`s or a method extraction.

## 8. Clean up with try-with-resources

Anything closeable goes in a try-with-resources header (previous lesson). `finally` is for cleanup of things that are not `AutoCloseable` — and even then, a small `AutoCloseable` wrapper is often cleaner.

## 9. Do not return `null` or a sentinel to signal failure when an exception fits — and vice versa

Absent-but-normal (a lookup that may miss) → `Optional` or a documented `null`/empty collection. Failure of an operation that should have worked → exception. A method that returns `null` on error forces every caller to remember a check; a method that throws for a normal miss forces every caller into a `try`. Match the mechanism to how common and how expected the outcome is.

## 10. `finally` never returns or throws

Covered in lesson 3: a `return` or `throw` in `finally` discards the in-flight exception. Reviewers reject it on sight.

## Assertions

```java
assert index >= 0 : "negative index " + index;
```

`assert` checks an *internal* invariant and throws `AssertionError` when it fails — **only if the JVM runs with `-ea`**. By default assertions are disabled, so they must never validate user input or arguments (use `if` + `IllegalArgumentException`), and code must not depend on their side effects. They are documentation that runs in tests and development.

## Interrupts

`InterruptedException` is special: catching it and ignoring it breaks the thread's cancellation. Either propagate it (`throws InterruptedException`) or restore the flag: `Thread.currentThread().interrupt();` before wrapping. Module 17.

## A handling checklist

| Question | Answer |
| --- | --- |
| Can this code *fix* the problem here? | Handle it: retry, fall back, default. Log at most once. |
| Can it add context? | Wrap with a cause and a message naming the attempt; rethrow. |
| Neither? | Do not catch. Let it propagate to a layer that can. |
| Is it a bug (NPE, IOOBE, ISE)? | Do not catch it; fix the code. |
| Is it cleanup? | try-with-resources or `try`/`finally`, no `catch`. |

## Where exceptions are finally handled

Every application has a few *top-level* handlers: the request loop of a server that converts exceptions to error responses, the `main` of a CLI that prints a message and exit code, a thread pool's uncaught-exception handler that logs. Those are the places for `catch (Exception e)`, full logging, and user-facing translation. Everything below them should mostly wrap or ignore, so the trace arrives intact.

## Interview angle

- *"What is wrong with an empty catch block?"* It hides failures; the program continues in a broken state with no record.
- *"Why not `catch (Exception e)` everywhere?"* It catches programming errors and treats them as recoverable, hiding bugs.
- *"Log and rethrow?"* Duplicates logs; log where handled, once.
- *"Are assertions enabled by default?"* No — `-ea`; never use them for argument validation.
- *"Exceptions vs return codes?"* Exceptions cannot be ignored silently, carry a trace and separate error handling from logic; return codes are for expected outcomes.

## Key takeaways

- Never swallow; catch the narrowest type; log once where handled, otherwise wrap with cause or let it propagate.
- Exceptions are for the exceptional — test what you can test; fail fast at the boundary with informative messages.
- Small `try` blocks; try-with-resources for cleanup; nothing returns or throws from `finally`.
- `assert` is off by default: internal invariants only. Restore the interrupt flag when catching `InterruptedException`.
