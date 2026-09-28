---
title: Checkpoint — Memory, performance and the interpreter
minutes: 25
seo-title: Python Performance Quiz: Memory, Big-O and Profiling Practice
description: Test your Python performance knowledge with 12 questions and three timed programs on reference counting, operation costs, bytecode, profiling and NumPy.
q: Why can reference counting not free two objects that refer to each other?
a: Each object holds a reference to the other, so neither count ever reaches zero, even when nothing outside refers to them. CPython's generational cycle collector finds such groups and frees them.
q: Why is `LOAD_FAST` cheaper than `LOAD_GLOBAL`?
a: `LOAD_FAST` reads a local from the frame's slot array by index; `LOAD_GLOBAL` looks the name up in the module's globals dict and then in the built-ins. Binding a hot global to a local turns those lookups into slot reads.
q: What does vectorisation remove from a numeric loop?
a: The per-element interpreter work: a boxed object allocated for each result, type dispatch on every operation, reference-count updates and the bytecode loop itself. The loop still runs, but in C over raw numbers.
---
This checkpoint covers the whole module: the object model with reference counting, the cycle collector, weak references and the memory levers; the cost model of the built-in operations and the loop shapes that hide a quadratic; bytecode, code objects, the four kinds of name load and the 3.11 specialising interpreter; measuring with `perf_counter`, `timeit`, `cProfile` and `tracemalloc` under proper hygiene; numeric performance with `array`, `bytes` and NumPy vectorisation; and the checklist for writing fast Python from the algorithm down to the hot loop.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does `del x` do to the object `x` referred to, and when is an object actually freed?
- Why can reference counting not free two objects that refer to each other?
- What is the cost of `x in lst` versus `x in s`, and of `lst.pop(0)` versus `deque.popleft()`?
- Why is `LOAD_FAST` cheaper than `LOAD_GLOBAL`?
- Which statistic does `timeit` report, and why the minimum?
- What is the difference between `tottime` and `cumtime` in a profile?
- What does vectorisation remove from a numeric loop?

The three programs are a top-k selection over a large generated stream with a heap, an order-preserving de-duplication of a large generated list that only passes with constant-time membership, and a word-frequency tally over generated tokens with a stable tie order — each sized so that the wrong data structure exceeds the time limit.
