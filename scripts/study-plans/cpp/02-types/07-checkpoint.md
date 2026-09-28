---
title: Checkpoint — Fundamental types
minutes: 25
seo-title: C++ Data Types Quiz: Overflow, Casts and Floating Point
description: Test your C++ types knowledge with 14 questions and three programs on integer overflow, floating-point comparison, casts, const, constexpr, auto and enum class.
q: What are `-7 / 2` and `-7 % 2` in C++?
a: `-7 / 2` is -3, because integer division truncates toward zero, and `-7 % 2` is -1, because the remainder takes the sign of the dividend. The identity `(a / b) * b + a % b == a` always holds.
q: Which initialisation form rejects `int x = 3.7`?
a: Brace initialisation. `int x{3.7};` is a compile error because list-initialisation refuses narrowing conversions, whereas `int x = 3.7;` compiles and silently stores 3.
q: What does `enum class` change about `int n = Red;`?
a: With a scoped enumeration, `int n = Red;` no longer compiles, for two reasons: the enumerator must be qualified, as `Colour::Red`, and there is no implicit conversion to `int`. Write `int n = static_cast<int>(Colour::Red);` when the number is really wanted.
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
