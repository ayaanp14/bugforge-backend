---
title: Checkpoint — Control flow
minutes: 22
seo-title: Java Control Flow Quiz: If, Switch and Loops Practice Test
description: Twelve questions and two programs on Java control flow: if and else, switch statements and expressions, loops, break, continue, labels and loop patterns.
q: Which if does a dangling else belong to in Java?
a: The nearest unmatched `if`. Java ignores indentation, so in `if (a) if (b) x(); else y();` the `else` belongs to `if (b)`. Braces around every body remove the ambiguity.
q: What must a switch expression be, and how does a block give its value?
a: A switch expression must be exhaustive: it needs a `default` for an `int` or `String` selector, or a case for every constant of an enum. A branch that is a block gives its value with `yield`, not `return`.
q: How many times does `for (int i = 0; i <= n; i++)` run?
a: n + 1 times, once for every value of `i` from 0 to n inclusive. The half-open form `i < n` runs exactly n times, which is why it is the standard for indexing arrays.
---
This checkpoint covers `if`/`else`, `switch` in its classic, arrow and expression forms, the four loops, `break`/`continue`/labels/`return`, and the standard loop patterns.

**How it works.** Twelve questions and two programs; 70% on the questions and both programs accepted clears the module. Retake as often as you like.

**Before you start**, make sure you can answer:

- Which `if` a dangling `else` belongs to.
- What fall-through is and which `switch` form has it.
- What a switch expression must be, and the keyword that yields a value from a block.
- The difference between `while` and `do-while`; how many times `i <= n` runs.
- What `break` does inside a `switch` inside a loop.
- How `all` and `any` loops are seeded and why.

The programs are pattern exercises: a grid search that needs the right exit, and a classifier that wants a switch expression.
