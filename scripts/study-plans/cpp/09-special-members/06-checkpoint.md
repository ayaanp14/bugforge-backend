---
title: Checkpoint — Copies, moves and the rule of five
minutes: 28
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
