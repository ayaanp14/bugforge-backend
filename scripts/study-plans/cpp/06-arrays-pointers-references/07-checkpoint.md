---
title: Checkpoint — Arrays, pointers and references
minutes: 25
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
