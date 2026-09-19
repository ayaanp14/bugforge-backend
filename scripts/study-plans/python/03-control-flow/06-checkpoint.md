---
title: Checkpoint — Control flow
minutes: 22
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
