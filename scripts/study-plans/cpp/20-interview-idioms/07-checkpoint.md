---
title: Final checkpoint — Interview idioms
minutes: 30
---
The last checkpoint of the C++ plan. It covers the contest template and its costs, the STL idiom sheet, the pitfalls review pass, `Vec<T>` and the hash map by hand, clean-solution habits and the theory drill — and, being the last one, it reaches back across the whole track.

**How it works.** Fifteen questions and three programs; 70% on the questions and every program accepted clears the module. With every other module complete, that also completes the plan.

**Before you start**, make sure you can answer these from memory:

- What `1LL * a * b` fixes that `(long long)(a * b)` does not, and why `-7 % 3` is `-1`.
- Why `i < v.size() - 1` runs on an empty vector, and what `map[key]` does inside a condition.
- The rule of five in one sentence, and why a hand-written destructor silently loses the moves.
- Why `push_back` is amortised O(1), and what a reallocation invalidates.
- What `Base b = derived;` keeps, and why deleting through a base pointer needs a virtual destructor.
- Which container gives an O(1) `splice`, and what `std::endl` does that `'\n'` does not.

The three programs are the classics interviewers set: an LRU cache from `std::list` and `std::unordered_map`, a shunting-yard evaluator with two stacks, and a polymorphic shape store behind `std::unique_ptr`.
