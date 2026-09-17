---
title: Checkpoint — Errors and exceptions
minutes: 25
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
