---
title: Checkpoint — Control flow
minutes: 25
seo-title: C++ Control Flow Quiz: If, Switch and Loops Practice Test
description: Test your C++ control flow with 14 questions and three programs on if, switch, fallthrough, for and while loops, range-based for, EOF reading and two pointers.
q: What does `[[fallthrough]];` change at run time and at compile time?
a: At run time, nothing: it is an empty statement. At compile time it records that a `case` body is meant to continue into the next one and stops `-Wimplicit-fallthrough` warning about it, which a comment cannot do.
q: When are two indices moving toward each other better than two nested loops?
a: When the data is sorted. Each comparison then rules out one index for good — if the sum is too small, the low element cannot pair with anything at or below the high index — so one pass of at most n - 1 steps replaces about n²/2 pair checks.
q: Why is `while (!std::cin.eof())` one iteration too many?
a: `eof()` turns true only after a read has tried to go past the end of the input. After the last value is read it is still false, so the loop runs once more, the read fails, and the body processes whatever the failed read left behind.
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
