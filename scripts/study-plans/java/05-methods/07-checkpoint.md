---
title: Checkpoint — Methods
minutes: 22
---
This checkpoint covers method declarations and calls, static versus instance, pass-by-value, overloading and its resolution rules, varargs, recursion, and scope.

**How it works.** Twelve questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- What a method signature consists of, and what it excludes.
- What `fill(int[] a) { a[0] = 9; a = new int[1]; }` does to the caller's array.
- Which overload `f(5)` picks among `f(long)`, `f(Integer)` and `f(int...)`.
- What `print(null)` does to `print(String...)`.
- What every recursion needs, and what happens without it.
- Why `main` cannot call an instance method directly.

The programs are a recursion with a helper and an accumulator, and a small overloaded utility exercised through a fixed input format.
