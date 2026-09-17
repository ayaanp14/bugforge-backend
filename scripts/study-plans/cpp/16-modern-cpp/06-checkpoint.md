---
title: Checkpoint — Modern C++
minutes: 25
---
This checkpoint covers the whole module: the standards and what compiles here, `auto`, `decltype` and structured bindings, `constexpr`/`consteval`/`constinit` and compile-time tables, the vocabulary types from `std::tuple` to `std::span` and `<chrono>`, and the C++20 set — concepts, ranges, `<=>`, `std::format` — with C++23 as reading.

**How it works.** Fifteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does `auto` drop from the initialiser's type, and how do `auto&` and `const auto&` differ?
- Why is `auto [k, v] = *it;` a copy, and what makes it a reference?
- What is the difference between `const`, `constexpr`, `consteval` and `constinit`?
- Why can a `consteval` function not be called with a loop variable from a `constexpr` function?
- Why does `std::chrono::seconds s = 1500ms;` fail to compile, and what does `duration_cast` do instead?
- Which of `std::format`, `std::print`, `std::expected` and `std::span` compile under `-std=c++20`?

The three programs are a duration ledger that sums `<chrono>` durations, a day-of-year calculator on a `constexpr` prefix-sum table and `std::optional`, and a concept-constrained statistics function over a `std::span` printed with `std::format`. Read the input format carefully before writing the parsing.
