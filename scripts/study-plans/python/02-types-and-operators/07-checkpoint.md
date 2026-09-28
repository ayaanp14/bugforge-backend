---
title: Checkpoint — Values, types and operators
minutes: 25
seo-title: Python Types Quiz: Division, Floats, Truthiness and Operators
description: Test your Python types and operators with 12 questions and three programs on floor division, floating point, truthiness, mutation, conversions and precedence.
q: What are `-7 // 2` and `-7 % 2` in Python?
a: `-7 // 2` is `-4`, because `//` floors toward negative infinity, and `-7 % 2` is `1`, because `%` takes the divisor's sign. Together they satisfy `-7 == 2 * (-7 // 2) + (-7 % 2)`.
q: What does `0 or "x"` evaluate to in Python?
a: It evaluates to `"x"`: `or` returns its first operand if that is truthy and its second otherwise, and `0` is falsy. Likewise `3 and 0` is `0`, because `and` returns the first operand if it is falsy and the second otherwise.
q: After `a = [1]; b = a; b += [2]`, what is `a`?
a: `a` is `[1, 2]`: `b = a` binds a second name to the same list, and `+=` extends that list in place. After a further `b = b + [3]`, `a` is still `[1, 2]`, because `+` builds a new list and rebinds only `b`.
q: Which exception does `int("3.0")` raise?
a: `ValueError`, because `int()` parses only whole-number text and `"3.0"` contains a decimal point. Convert in two steps, `int(float("3.0"))`, which parses the float and then truncates it toward zero.
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
- What does `(x & (x - 1)) == 0` test, and would it mean the same without the brackets?

The three programs are a digit and bit report that uses integer arithmetic and the base-conversion functions, a temperature table that formats floats to fixed widths and picks labels with chained comparisons, and an exact-change calculator that keeps money in integer cents.
