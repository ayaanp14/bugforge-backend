---
title: Checkpoint — Templates and generic programming
minutes: 28
seo-title: C++ Templates Quiz: Deduction, Concepts and Traits Practice
description: Practise C++ generic programming with 13 questions and three programs on templates, CTAD, specialisation, fold expressions, concepts and traits.
q: Why is a function template overloaded rather than specialised?
a: Because a full specialisation of a function template is not an overload candidate: the compiler picks the best primary template or non-template first, and a better-matching template can hide the specialisation. Function templates also cannot be partially specialised. A plain overload takes part in resolution and wins exact-match ties.
q: Which fold forms are legal on an empty pack?
a: Every binary fold, such as `(0 + ... + xs)`, because it supplies its own initial value. Among unary folds, only those over `&&`, `||` and the comma operator, which give `true`, `false` and nothing. `(xs + ...)` on an empty pack does not compile.
q: Is `bool` a `std::integral`, and why does that matter?
a: Yes — `bool` is an integer type to the language, so it satisfies `std::integral`. In an overload set constrained on `std::integral`, a `bool` argument therefore picks the integer overload; add `&& !std::same_as<T, bool>` when `bool` must go elsewhere.
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
