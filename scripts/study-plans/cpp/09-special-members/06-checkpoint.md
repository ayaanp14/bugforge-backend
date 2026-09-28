---
title: Checkpoint — Copies, moves and the rule of five
minutes: 28
seo-title: C++ Copy and Move Quiz: Rule of Five Practice Test
description: Test your C++ copy and move semantics with 14 questions and three programs on copy constructors, destructors, std::move, the rule of five and copy elision.
q: Why does copy-and-swap need no self-assignment check?
a: The parameter is taken by value, so the copy is complete before the body runs. For `a = a`, `a` is copied into the parameter, the two are swapped, and the parameter's destructor frees the old block; `a` keeps its contents, now in a new block, and nothing is read after being freed.
q: Which declarations stop the compiler generating the move operations?
a: A user-declared copy constructor, copy assignment operator or destructor — including ones written `= default` or `= delete` — or a declaration of one of the move operations. After that, rvalues bind to `const T&` and are copied unless the moves are declared, for example as `= default`.
q: Why is `return std::move(local);` worse than `return local;`?
a: `return local;` lets the compiler build the local directly in the caller's object (NRVO) or, at worst, move it implicitly. `std::move(local)` is not a plain name, so NRVO is ruled out and a move is always performed.
q: What state is a `std::vector` in after being moved from?
a: After `auto b = std::move(a);` the vector `a` is guaranteed to be empty. A moved-from `std::string` is only valid but unspecified — usually empty in practice — so a program must not rely on it and should assign a new value before reading it.
---
This checkpoint covers the whole module: copy construction versus copy assignment, destructors and the order things die, the rule of three and copy-and-swap, rvalue references and `std::move`, the moved-from state and `noexcept`, the generation table behind the rule of five and the rule of zero, and value categories with guaranteed elision.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Why does the generated copy of a class with an owning raw pointer double-delete?
- In what order are three locals, and the members of one object, destroyed?
- Why does copy-and-swap need no self-assignment check?
- What does `std::move` do, and what does it not do?
- Which declarations stop the compiler generating the move operations?
- What state is a `std::vector` in after being moved *from*, and a `std::string`?
- Why is `return std::move(local);` worse than `return local;`?

The three programs are a fixed-capacity stack with all five special members driven by commands, an event trace through a struct of two probes that you predict before you run, and two shelves passing books between them through `std::unique_ptr` with no special members at all.
