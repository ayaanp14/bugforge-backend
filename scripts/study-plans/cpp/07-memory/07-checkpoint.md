---
title: Checkpoint — Memory, ownership and RAII
minutes: 25
seo-title: C++ Memory Management Quiz: RAII and Smart Pointers Practice
description: Test your C++ memory management with 14 questions and three programs on the stack and heap, new and delete, RAII, smart pointers and memory-error tools.
q: What does `std::move` leave in a `std::unique_ptr`?
a: A null pointer. After `auto b = std::move(a);` ownership has passed to `b`, and `a` is guaranteed to be empty — a defined, testable state, so `if (a)` is false, and dereferencing `a` would be undefined behaviour.
q: What runs between a `throw` and the `catch` that handles it?
a: Stack unwinding: every automatic object in every frame being abandoned is destroyed, in reverse order of construction, before the handler runs. Destructors therefore print their messages before the `catch` block does, which is what makes RAII cleanup work on the exception path.
q: What does `lock()` on a `weak_ptr` return when the object is gone?
a: An empty `std::shared_ptr`. A `weak_ptr` does not keep its object alive, so once the last owning `shared_ptr` is destroyed, `lock()` returns an empty pointer that tests false, and `expired()` returns true. Always test the result of `lock()` before using it.
q: Which three stacks does an AddressSanitizer use-after-free report show?
a: Where the bad access happened, where the memory was freed, and where it was originally allocated. Together they tell the whole story of a use-after-free: which owner released the block and which borrower kept using it afterwards.
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
