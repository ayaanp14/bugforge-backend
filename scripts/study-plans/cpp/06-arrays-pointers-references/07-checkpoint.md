---
title: Checkpoint — Arrays, pointers and references
minutes: 25
seo-title: C++ Pointers Quiz: Arrays, References and Const Practice Test
description: Test your C++ pointer skills with 15 questions and three programs on arrays and std::array, pointer arithmetic, references, const correctness and grids.
q: What does an array's name become when you pass it to a function?
a: It decays to a pointer to the array's first element, and the size is lost: the parameter is just a `T*`, whatever the brackets say. Pass the length separately, pass a `[begin, end)` pair of pointers, or use `std::array` or `std::vector`, which keep their size.
q: Which pointer may you form but never dereference?
a: The one-past-the-end pointer, `a + N` for an array of `N` elements. It may be formed, compared and subtracted, and it marks the end of the range `[a, a + N)`, but reading `*(a + N)` is undefined behaviour.
q: Why is a reference into a `std::vector` unsafe after `push_back`?
a: `push_back` may reallocate: when the capacity runs out, the vector moves its elements to a new, larger block and frees the old one. Any reference, pointer or iterator into the old block then dangles. Re-read the element afterwards, or hold an index, which survives.
q: Where does cell (r, c) of an R × C grid live in a flat vector?
a: At index `r * C + c`. Row-major order stores row 0's `C` elements first, then row 1's, so reaching row `r` skips `r` full rows before moving `c` further along.
---
This checkpoint covers the whole module: built-in arrays and `std::array`, pointers and `nullptr`, pointer arithmetic and the `[begin, end)` convention, references and dangling, const correctness, and grids.

**How it works.** Fifteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does an array's name become when you pass it to a function, and what is lost?
- What is `p[i]` in terms of `*` and `+`, and what does `q - p` give?
- Which pointer may you form but never dereference?
- Name the three things a reference cannot do that a pointer can.
- What is the difference between `const int*` and `int* const`?
- Where does cell `(r, c)` of an `R × C` grid live in a flat vector?
- Why is a reference into a `std::vector` unsafe after `push_back`?

The three programs are a pointer walk over runs of equal values, a flood count on a character grid, and a statistics function with const-correct reference parameters. Print values, indices and differences — never an address.
