---
title: Checkpoint — Arrays
minutes: 22
seo-title: Java Arrays Quiz: 2D Arrays, Copying and Patterns Practice
description: Test your Java array skills with 12 questions and two programs on indexing, 2D and jagged arrays, the Arrays class, copying, rotation and prefix sums.
q: What does `new String[3]` contain in Java?
a: Three `null` references. Every slot of a new array starts at its type's default value, and for any reference type, `String` included, that default is `null` — so `names[0].length()` before any assignment throws a `NullPointerException`.
q: What does `Arrays.asList(new int[]{1, 2}).size()` return?
a: 1. `Arrays.asList` does not box primitives, so the whole `int[]` becomes the list's single element and the result is a `List<int[]>`. Use `Arrays.stream(a).boxed().toList()` to get a `List<Integer>`.
q: Why does a prefix sum array have n + 1 entries?
a: The extra leading zero, `prefix[0] = 0`, lets every range sum be `prefix[to] - prefix[from]`, including ranges that start at index 0, without a special case. `prefix[i]` is then the sum of the first `i` elements.
---
This checkpoint covers array creation and indexing, two-dimensional and jagged arrays, the `Arrays` class and `System.arraycopy`, aliasing and copying, and the standard in-place patterns.

**How it works.** Twelve questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- What `new String[3]` contains, and what `a.length` is (field or method).
- How many objects `new int[3][4]` creates, and what `clone()` copies on it.
- What `Arrays.asList(new int[]{1, 2}).size()` returns.
- Why a getter should return `values.clone()`.
- How to rotate an array in place, and why prefix arrays have `n + 1` entries.

The programs are a matrix rotation and a prefix-sum range query — both classics that reward knowing the pattern.
