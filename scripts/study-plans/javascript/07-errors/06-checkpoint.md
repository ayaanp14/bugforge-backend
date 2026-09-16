---
title: Checkpoint — Errors
minutes: 24
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
