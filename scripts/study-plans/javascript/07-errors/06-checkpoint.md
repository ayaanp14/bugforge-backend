---
title: Checkpoint — Errors
minutes: 24
seo-title: JavaScript Error Handling Quiz: Try, Catch and Custom Errors
description: Test JavaScript error handling with 12 questions and three programs: try, catch and finally, error types, custom errors with cause, validation, stack traces.
q: What does a `return` inside `finally` do to an exception?
a: It swallows it. A `return` in `finally` overrides whatever the `try` or `catch` was completing with, including a propagating exception, so the function returns normally and the error is lost without a trace.
q: What is the difference between TypeError, RangeError, SyntaxError and ReferenceError?
a: `TypeError` is a value of the wrong type for an operation; `RangeError` the right type but an impossible value, including a stack overflow in V8; `SyntaxError` text that does not parse, including bad `JSON.parse` input; `ReferenceError` a read of an undeclared name or of a variable in its temporal dead zone.
q: Why does per-item error recovery need a type guard?
a: Without one, a `catch` inside the loop also catches bugs such as a `TypeError`, and every record silently fails for the same defect. Guard with `instanceof` or a `code`: record expected failures and move on, but rethrow anything else so a bug aborts the batch loudly.
---
This checkpoint covers the mechanics of `throw`/`try`/`catch`/`finally` (including what `finally` overrides and when the stack is captured), the built-in error types and what triggers each, designing custom errors with `name`, `code`, fields and `cause`, the boundary strategy for where to catch, per-item recovery with type guards, retries, result objects, validation at the edge with guard clauses, assertions for invariants, and reading a stack trace.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- What a `return` inside `finally` does to a propagating exception; why `catch (e) {}` is dangerous.
- `TypeError` versus `RangeError` versus `SyntaxError` versus `ReferenceError`; what a stack overflow is.
- Why custom errors carry a `code` as well as a class; what `cause` is for; why `JSON.stringify(err)` is `{}`.
- Where to catch (boundaries) and what the layers in between may do; why per-item recovery needs a type guard.
- `Number.isFinite` versus `typeof`; validation versus assertion; how to read the top frame and column of a trace.

The programs are a transaction processor with a custom error hierarchy and all-or-nothing transfers, a configuration loader that wraps failures with `cause` and reports the chain, and an RPN calculator that raises the right error type for each kind of bad input.
