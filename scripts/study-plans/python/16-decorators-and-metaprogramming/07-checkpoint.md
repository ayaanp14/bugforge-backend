---
title: Checkpoint — Decorators, descriptors and the data model
minutes: 25
---
This checkpoint covers the whole module: decorators as `f = deco(f)` with `@wraps`, arguments and stacking, closures with cells, late binding and factories, the descriptor protocol behind properties, methods and validated attributes, the attribute hooks `__getattr__`, `__getattribute__` and `__setattr__` with reflection and `__slots__`, classes as objects with `type`, `__new__`, `__init_subclass__` and metaclasses, and the rest of the data model through a `Vector`.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does `@retry(3)` above a `def` expand to, and how many nested functions does `retry` need?
- Why do three lambdas created in a loop all see the same `i`, and what are the two fixes?
- What is the difference between a data and a non-data descriptor, and which one is `property`?
- When is `__getattr__` called, and what must it raise for names it does not handle?
- What does `__init_subclass__` receive, and what is it for?
- What should a binary dunder return for an operand it does not understand?
- Why must `__setattr__` write through `object.__setattr__`?

The three programs are a decorator suite — timing-free tracing, counting and memoising — stacked in both orders, a small validation framework built from descriptors with `__set_name__` and a registering `__init_subclass__`, and a complete `Vector` value type exercised through arithmetic, formatting and containment.
