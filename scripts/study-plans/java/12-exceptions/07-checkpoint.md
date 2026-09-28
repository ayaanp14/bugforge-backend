---
title: Checkpoint — Exceptions
minutes: 24
seo-title: Java Exceptions Quiz: Try, Catch and Finally Practice Test
description: Practise Java exceptions with 14 questions and two programs on checked and unchecked exceptions, finally, try-with-resources, custom exceptions and chaining.
q: Where does Error sit in the Java exception hierarchy?
a: `Error` is one of the two direct subclasses of `Throwable`, beside `Exception`. Like `RuntimeException` it is unchecked, but it signals failures of the JVM itself, such as `OutOfMemoryError`, which programs should not catch.
q: What does a return inside finally do to a pending exception?
a: It discards it. A `return` in `finally` replaces whatever the `try` or `catch` was about to do, so the method returns normally and the in-flight exception is lost without a trace.
q: What happens to an exception thrown by close() in try-with-resources?
a: If the body has already thrown, the `close()` exception is attached to the body's exception as a suppressed exception, and the body's exception propagates. If the body completed normally, the `close()` exception propagates itself.
q: Why is catching Exception around business logic dangerous?
a: It catches programming errors — a `NullPointerException`, a `ClassCastException` — along with the failures you meant to handle, so bugs look like transient problems and are retried or ignored instead of fixed.
---
This checkpoint covers the exception hierarchy, checked versus unchecked, `try`/`catch`/`finally` semantics, try-with-resources, custom exceptions with chaining, and the handling practices.

**How it works.** Fourteen questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- Which classes are checked, which unchecked, and where `Error` sits.
- What `finally` does to a pending `return`, and what a `return` inside `finally` does.
- The order in which resources are closed and what happens to a `close()` exception.
- Why you pass the cause when wrapping, and why you log once.
- Why `catch (Exception e)` around business logic is dangerous.

The programs are a validating parser that reports every failure with a custom exception carrying data, and a resource-managed processor that proves close order and suppressed exceptions.
