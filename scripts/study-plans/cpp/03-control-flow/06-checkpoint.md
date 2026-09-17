---
title: Checkpoint — Control flow
minutes: 25
---
This checkpoint covers the whole module: branching and the conditional operator, `switch` with fallthrough and enums, the three loops and the unsigned countdown, range-based `for` with `auto&` and structured bindings, and the loop patterns from search to two pointers.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Why is `if (0 < x < 10)` true for every `x`?
- What does `[[fallthrough]];` change at run time, and what does it change at compile time?
- Why does `for (std::size_t i = v.size() - 1; i >= 0; --i)` never terminate?
- What is the difference between `for (auto s : v)` and `for (auto& s : v)`?
- Why is `while (!std::cin.eof())` one iteration too many?
- When is a pair of indices moving toward each other better than two nested loops?

The three programs are a run-length encoder that reads lines with `std::getline` after a count, a bank ledger that reads commands until the input ends, and a prime lister built from nested loops with an early exit. Read the input format carefully before writing the loop.
