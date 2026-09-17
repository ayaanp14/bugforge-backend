---
title: Checkpoint — Memory, ownership and RAII
minutes: 25
---
This checkpoint covers the whole module: the four storage durations and the stack-frame picture, `new`/`delete` and the ownership contract, RAII and the guarantees behind it, `std::unique_ptr`, `std::shared_ptr` with `std::weak_ptr`, and the memory-error catalogue with the tools that find it.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- In what order are three automatic objects declared in one block destroyed, and does an early `return` change it?
- What is undefined about `delete` on a block that came from `new[]`?
- What runs between a `throw` and the `catch` that handles it?
- What does `std::move` leave in a `std::unique_ptr`, and can you test it?
- Why does a `weak_ptr` break a `shared_ptr` cycle, and what does `lock()` return when the object is gone?
- Which three stacks does an AddressSanitizer use-after-free report show?

The three programs are a growable stack that owns its array with `new[]`/`delete[]`, a ledger of `std::shared_ptr` handles whose `use_count` you print, and a task pipeline where a scope guard and a factory's `unique_ptr` must both behave on the exception path. Every destructor message is in a defined order — trace it on paper before you run.
