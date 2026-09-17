---
title: Checkpoint — Templates and generic programming
minutes: 28
---
This checkpoint covers the whole module: function templates and deduction, class templates with out-of-class members and CTAD, full and partial specialisation and the traits pattern, non-type parameters and packs with fold expressions, concepts and constrained `auto`, and the type traits behind `if constexpr` dispatch.

**How it works.** Thirteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Why does `max_of(3, 2.5)` fail to compile, and what are the two ways to fix it?
- Why must a template's definition live in the header rather than a `.cpp` file?
- What does `std::vector v{3}` deduce, and how many elements does it hold?
- Why is a function template overloaded rather than specialised?
- Which fold forms are legal on an empty pack?
- Is `bool` a `std::integral`, and why does that matter for an overload set?
- Why is `std::is_same_v<T, std::string>` false inside `f(T&& x)` for a `std::string` lvalue?

The three programs are a `Queue<T>` instantiated for the element type named on the first line, a statistics report whose overloads are chosen by concepts, and a `Table<K, V>` whose header line comes from a `TypeName` trait. Read the type word first; everything else follows from it.
