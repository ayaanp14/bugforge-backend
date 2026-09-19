---
title: Checkpoint — Inheritance, protocols and duck typing
minutes: 25
---
This checkpoint covers the whole module: subclassing with `super()` and attribute lookup, duck typing with EAFP and `hasattr`, abstract base classes and `collections.abc`, multiple inheritance with the MRO, cooperative `super()` and mixins, `typing.Protocol` with `runtime_checkable`, and composition over inheritance with Liskov, delegation and `UserDict`.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What happens when a subclass defines `__init__` and does not call `super().__init__()`?
- Why does `describe()` in a base class run the subclass's `speak()`?
- What does `isinstance(x, Iterable)` check, and why exclude `str` from a sequence test?
- Which two methods make a class a full `collections.abc.Sequence`?
- For `class D(B, C)` where both inherit from `A`, what is `D.__mro__`, and what does `super()` in `B` call?
- What does `@runtime_checkable` change about a `Protocol`?
- Why does `dict.update` bypass an overridden `__setitem__`, and what class fixes it?

The three programs are a shape hierarchy on an ABC with a template method, a plugin registry that validates objects against a runtime-checkable protocol, and a case-folding mapping built on `UserDict` alongside a stack that composes a list.
