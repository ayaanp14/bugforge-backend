---
title: Checkpoint — Performance and undefined behaviour
minutes: 25
seo-title: C++ Performance Quiz: Undefined Behavior, Cache and Padding
description: Test your C++ with 14 questions and three programs on undefined behaviour, overflow checks, copy and allocation costs, cache lines, padding and benchmarks.
q: Why does `if (x + 1 < x)` never detect an overflow at -O2?
a: Signed overflow is undefined behaviour, so the compiler assumes `x + 1` cannot overflow and folds the test to `false`. Test before the operation instead: `x > std::numeric_limits<int>::max() - 1`, a wider type, or `__builtin_add_overflow`.
q: What is the size of `struct { char a; double b; char c; }`?
a: 24 bytes on x86-64: seven bytes of padding after `a` align `b` to 8, and seven more after `c` round the size up to a multiple of 8. Reordering the members as `double b; char a; char c;` removes the interior padding and makes it 16.
q: Why is an unprinted benchmark result worthless?
a: Under the as-if rule the compiler only has to preserve observable behaviour, and a value that never reaches an output is not observable. Dead-code elimination can therefore remove the whole computation, and the benchmark times nothing at all.
---
This checkpoint covers the whole module: the undefined behaviour catalogue and the well-defined detectors for it, the cost model of copies, allocations and calls, cache lines, struct padding and traversal order, what the optimiser does under the as-if rule, and how to measure without being lied to.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Why does `if (x + 1 < x)` never detect an overflow at `-O2`, and what do you write instead?
- What does passing a `std::vector<int>` by value cost, and by `const&`?
- How many elements are moved over a thousand `push_back`s into a doubling vector, and what does `reserve` change?
- What is the size of `struct { char a; double b; char c; }` on this platform, and what does reordering do?
- Why does a column-major inner loop over a wide matrix load a cache line per element?
- What does the as-if rule permit, and why does it make an unprinted benchmark result worthless?
- Which statistic of a set of benchmark runs should you report, and why not the mean?

The three programs are an overflow-safe statistics report over `long long` values, an array-of-structs against struct-of-arrays cache-line audit built on the padding rule, and an operation counter that runs insertion sort and selection sort on the same input and reports the work each did. Every one of them counts; none of them times.
