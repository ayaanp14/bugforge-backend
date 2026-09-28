---
title: Final checkpoint — Interview idioms
minutes: 32
seo-title: Java Interview Practice Test: Idioms, Pitfalls and Theory
description: The final Java interview practice test: 15 questions and three classic programs — two-sum, a min-stack and anagram grouping — with pitfalls and theory review.
q: What time complexity does n ≤ 10⁵ allow?
a: O(n log n) or better. Java does about 10⁸ simple operations per second, so an O(n²) solution would need 10¹⁰ operations and miss the time limit; think sorting, hashing, heaps or binary search.
q: What does "a.b".split(".") return in Java?
a: An empty array. `split` treats its argument as a regular expression, `.` matches every character, and the empty strings between the separators are all dropped as trailing empties. Use `split(Pattern.quote("."))` instead.
q: How do you implement a min-stack with O(1) operations in Java?
a: Keep a second stack beside the values: each push also pushes the smaller of the new value and the current minimum, and each pop removes from both. The minimum is then a `peek` on the second stack, so push, pop and get-minimum are all O(1).
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
