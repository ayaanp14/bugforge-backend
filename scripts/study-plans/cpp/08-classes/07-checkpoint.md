---
title: Checkpoint — Classes and objects
minutes: 25
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
