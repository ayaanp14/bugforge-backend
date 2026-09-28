---
title: Checkpoint — Control flow
minutes: 22
seo-title: Python Control Flow Quiz: Loops, Range, Zip and Match
description: Test your Python control flow with 12 questions and three programs on if and elif, while and for loops, range, enumerate, zip, match and loop patterns.
q: When does the else of a Python for or while loop run?
a: It runs when the loop finishes normally — the condition became false or the iterable ran out — and not when the loop is left by `break`. That makes it the "not found" branch of a search, such as a prime test that breaks on the first divisor it finds.
q: What does `range(2, 10, 3)` produce?
a: The integers 2, 5 and 8: it starts at 2, steps by 3 and stops before 10, because `stop` is excluded. By the same half-open rule, `range(len(xs))` is exactly the valid indices of `xs`, 0 to `len(xs) - 1`.
q: What does zip do when its inputs have different lengths?
a: It stops at the shortest input without any warning. Pass `strict=True` (Python 3.10 and later) to make a length mismatch raise `ValueError`, or use `itertools.zip_longest` to pad the shorter input instead.
---
This checkpoint covers the whole module: `if`/`elif`/`else` and the guard-clause shape, `while` with `break`, `continue` and the loop `else`, `for` over any iterable with `range`, `enumerate` and `zip`, structural pattern matching with `match`, and the loop patterns — accumulate, search, running state, two pointers, prefix sums and building output.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What is a guard clause, and what does it do to the indentation of the rest of the function?
- When does the `else` of a `while` or `for` loop run, and when does it not?
- What does `range(2, 10, 3)` produce, and why is `range(len(xs))` exactly the valid indices?
- What does `zip` do when its inputs have different lengths, and how do you make that an error?
- In a `case` pattern, what is the difference between `RED` and `Colour.RED`?
- Why must a list not be modified while a `for` loop iterates over it?
- Which built-ins replace the accumulate, count and extreme loops?

The three programs are a FizzBuzz with configurable divisors, a prime lister built on a trial-division loop with `for … else`, and a bank account whose commands are dispatched with `match`.
