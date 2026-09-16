---
title: Final checkpoint — Interview idioms
minutes: 32
---
The last checkpoint of the Java plan. It covers the interview template and complexity budget, the `equals`/`hashCode`/`Comparable` contracts, the thirty pitfalls, the collections idiom sheet, clean-solution habits, and the theory drill — and, because it is the last one, it reaches back across the whole track.

**How it works.** Fifteen questions and three programs; 70% on the questions and every program accepted clears the module — and, with every other module complete, the plan.

**Before you start**, make sure you can answer:

- What complexity `n ≤ 10⁵` allows, and where `int` overflows in a typical solution.
- Why overriding `equals` without `hashCode` breaks `HashMap`, and why keys must be immutable.
- `-7 % 3`, `Integer.valueOf(128) == Integer.valueOf(128)`, `"a.b".split(".")`, and the `Arrays.sort(int[])` worst case.
- The idiom for top-k frequent, sliding-window maximum, subarray sums and anagram groups.
- How to structure a solution so its correctness is visible, and what to say about complexity.
- Overload versus override resolution — and why fields are never polymorphic.

The programs are the classics interviewers actually set: two-sum with a hash map and pair counting, a min-stack with O(1) operations, and anagram grouping — each with the idiom sheet's structure and the pitfalls list applied.
