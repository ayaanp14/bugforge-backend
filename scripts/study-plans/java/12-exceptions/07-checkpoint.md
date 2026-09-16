---
title: Checkpoint — Exceptions
minutes: 24
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
