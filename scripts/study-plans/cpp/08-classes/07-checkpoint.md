---
title: Checkpoint — Classes and objects
minutes: 25
seo-title: C++ Classes and Objects Quiz: Constructors and Const Practice
description: Test your knowledge of C++ classes with 14 questions and three programs on structs, constructors, this and const, static members, friends and headers.
q: Why does `Money m = 5;` fail when the constructor is `explicit`?
a: `Money m = 5;` is copy-initialisation, which needs an implicit conversion from `int` to `Money`, and `explicit` forbids exactly that. `Money m{5};` is direct-initialisation: it calls the constructor by name, so `explicit` does not block it.
q: What type does `this` have inside a const member function?
a: Inside a `const` member function of class `T`, `this` is a `const T*`, a pointer to a const object. Every data member is therefore read-only there, except members declared `mutable`, and only other `const` member functions can be called.
q: Why does a chaining mutator return `T&` rather than `T`?
a: Returning `T&` with `return *this;` hands the next call the same object, so every call in the chain modifies it. Returning `T` by value hands back a copy: the rest of the chain modifies temporaries and the original object is left unchanged, with no compiler error.
q: What are the only two differences between struct and class in C++?
a: Default member access — `public` in a `struct`, `private` in a `class` — and default inheritance, which is likewise public for a `struct` and private for a `class`. Everything else, including member functions and constructors, is identical.
---
This checkpoint covers the whole module: structs, aggregates and designated initialisers, constructors and the member-initialiser list, `this` and const-correctness, static members, encapsulation with friends, and the header/source split behind a worked design.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What are the only two differences between `struct` and `class`?
- In what order are members initialised, and what does the order of the member-initialiser list change?
- Why does `Money m = 5;` fail when the constructor is `explicit`, while `Money m{5};` works?
- What type does `this` have inside a `const` member function?
- Why does a chaining mutator return `T&` rather than `T`?
- What goes wrong when an instance counter is incremented in the constructor but copying is left to the compiler?
- Which operand of `operator<<` makes it impossible to write as a member?

The three programs are a gradebook whose `Student` chains `add()` and validates every mark, a `Grid` with const and non-const `at()` and a half-turn written as one chain, and an assembly line whose instrumented parts show the construction and destruction order of a class with three members and a static count. Trace the instrumented one on paper before you run it.
