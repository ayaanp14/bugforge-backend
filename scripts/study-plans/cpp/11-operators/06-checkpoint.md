---
title: Checkpoint — Operator overloading
minutes: 25
---
This checkpoint covers the whole module: which operators to overload and where, the compound-first idiom, `==` and the defaulted `<=>` with its ordering categories, `<<` and `>>` as free functions that respect the stream's state, `operator[]` pairs, function objects as comparators and hashes, and `explicit` on constructors and conversions.

**How it works.** Thirteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Why must `2 * v` be a free function rather than a member of `Vec2`?
- What does a defaulted `operator<=>` give you that a hand-written one does not?
- Which ordering category does a struct with a `double` member deduce, and why?
- Why does `std::setw(10) << money` need `operator<<` to insert one string?
- What goes wrong when a comparator's `operator()` is not `const`?
- Which contexts accept an `explicit operator bool`, and which refuse it?

The three programs are a `Polynomial` with arithmetic, evaluation through `operator()` and a formatted `<<`; a grid walk that counts visits through a `std::hash<Point>` specialisation and prints the cells sorted; and a `Duration` ledger that reads `h:mm:ss` through `>>`, orders with a defaulted `<=>` and prints through `<<` without leaking a fill character.
