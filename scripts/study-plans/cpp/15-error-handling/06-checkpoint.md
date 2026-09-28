---
title: Checkpoint — Errors and exceptions
minutes: 25
seo-title: C++ Error Handling Quiz: Exceptions, Optional and Variant
description: Practise C++ error handling with 14 questions and three programs: translating stoi exceptions, an RPN evaluator returning a variant, and an RAII rollback guard.
q: What does `v.at(9)` throw, and what does `v[9]` do instead?
a: On a vector with fewer than ten elements, `v.at(9)` throws `std::out_of_range`. `v[9]` performs no check at all, so reading past the end is undefined behaviour rather than an exception.
q: Is `*opt` on an empty optional a throw or undefined behaviour?
a: Undefined behaviour. The dereference operators of `std::optional` do not check; only `value()` throws, with `std::bad_optional_access`. Test the optional with `if (opt)` before dereferencing it.
q: What does `NDEBUG` do to an `assert`?
a: When `NDEBUG` is defined, `assert` expands to nothing, so its condition is not even evaluated. That is why an assertion must have no side effects and must never be the only check on user input.
q: In a parse, validate, execute pipeline, which layer throws?
a: The execute layer. Parse returns an optional because malformed input is ordinary, validate returns an error code the caller switches on, and execute throws when the world refuses; the reporting boundary then catches, translates and prints.
---
This checkpoint covers the whole module: throwing and catching with the standard hierarchy and your own, the three exception-safety guarantees with RAII and `noexcept`, `std::optional` for a value that may be absent, `std::variant` with `std::visit` for a value that is one of several types, and error codes, assertions and the per-layer strategy.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Why is `catch (const std::exception& e)` right and `catch (std::exception e)` wrong?
- What does `v.at(9)` throw, and what does `v[9]` do instead?
- What does `std::vector` do on reallocation when the element's move constructor is not `noexcept`?
- Is `*opt` on an empty optional a throw or undefined behaviour?
- What does `std::visit` refuse to compile?
- What does `NDEBUG` do to an `assert`?
- In a parse → validate → execute pipeline, which layer throws?

The three programs are a score reader that translates `std::stoi`'s exceptions into its own hierarchy, an RPN evaluator that returns a `std::variant` of result or failure, and a key–value store whose transactions roll back through an RAII guard. Every program must catch what it provokes and return 0 — an exception that escapes `main` is a runtime error, not a wrong answer.
