---
title: Checkpoint — Values, types and operators
minutes: 25
---
This checkpoint covers the whole module: arbitrary-precision integers and the floor semantics of `//` and `%`, floating point and the three rules for comparing, printing and summing floats, truthiness and what `and`/`or` return, names bound to objects and the difference between rebinding and mutation, the explicit conversions and their errors, and operator precedence with the bitwise idioms.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What are `-7 // 2` and `-7 % 2`, and which invariant relates them to `-7`?
- Why is `0.1 + 0.2 == 0.3` false, and what do you write instead?
- What does `0 or "x"` evaluate to, and what does `3 and 0` evaluate to?
- After `a = [1]; b = a; b += [2]`, what is `a`? And after `b = b + [3]`?
- Which exception does `int("3.0")` raise, and what two-step conversion works?
- What is `-2 ** 2`, and why?
- What does `x & (x - 1) == 0` test, once parenthesised correctly?

The three programs are a digit and bit report that uses integer arithmetic and the base-conversion functions, a temperature table that formats floats to fixed widths and picks labels with chained comparisons, and an exact-change calculator that keeps money in integer cents.
