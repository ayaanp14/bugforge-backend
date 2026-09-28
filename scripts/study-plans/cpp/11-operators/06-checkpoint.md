---
title: Checkpoint — Operator overloading
minutes: 25
seo-title: C++ Operator Overloading Quiz: Spaceship, Streams, Functors
description: Practise C++ operator overloading with 13 questions and three programs on the compound-first idiom, spaceship operator, stream operators, hashing and explicit.
q: Why must `2 * v` be a free function rather than a member of `Vec2`?
a: A member operator's left operand must already be the class type and never receives an implicit conversion, so a member `Vec2::operator*(double)` handles `v * 2` but not `2 * v`. A free function `operator*(double, Vec2)` treats both operands as ordinary parameters.
q: Which ordering category does a struct with a `double` member deduce?
a: `std::partial_ordering`. A defaulted `auto operator<=>` deduces the weakest category among its members, and `double` is only partially ordered because a NaN is neither less than, equal to nor greater than anything. Declare the return type as `std::strong_ordering` to turn that into a compile error instead.
q: Which contexts accept an `explicit operator bool`?
a: Only contextual conversions: the conditions of `if`, `while` and `for`, the first operand of `?:`, the operands of `!`, `&&` and `||`, and an explicit `static_cast<bool>`. Initialising a `bool` or an `int` from the object, or using it in arithmetic, is refused.
q: What goes wrong when a comparator's `operator()` is not `const`?
a: `std::set` and `std::map` call the comparator through a `const` object, so a non-const `operator()` cannot be called there; libstdc++ stops compilation with a static assertion that the comparison object must be invocable as const. Mark every comparator's call operator `const`.
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
