---
title: Checkpoint — Fundamental types
minutes: 25
---
This checkpoint covers the whole module: the built-in types and their sizes on this platform, integer arithmetic with its overflow rules and bit operators, floating-point representation and printing, conversions and the four casts, `const`, `constexpr` and `auto`, and literals and scoped enumerations.

**How it works.** Fourteen questions and three programs; 70% on the questions and every program accepted clears the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What happens when an `int` holding `2147483647` is incremented, and how do you detect it first?
- What are `-7 / 2` and `-7 % 2`?
- Why is `0.1 + 0.2 == 0.3` false, and what do you compare with instead?
- Which initialisation form rejects `int x = 3.7`?
- What does `auto s = "text";` deduce?
- Why is `-1 < 1u` false, and which C++20 function gets it right?
- What does `enum class` change about `int n = Red;`?

The three programs are a checked running product, an invoice kept in integer cents, and a literal classifier that names each token's type and value — read its input format twice; the cases include suffixes and a `char` literal.
