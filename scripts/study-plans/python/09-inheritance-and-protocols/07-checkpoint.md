---
title: Checkpoint — Inheritance, protocols and duck typing
minutes: 25
seo-title: Python Inheritance Quiz: MRO, ABCs, Protocols and Duck Typing
description: Test your Python OOP with 12 questions and three programs on super, duck typing, abstract base classes, the MRO and mixins, Protocol and composition.
q: Why does `describe()` in a base class run the subclass's `speak()`?
a: Because `self` is the subclass instance, and attribute lookup for `self.speak` starts at the instance's own class. Every Python method is effectively virtual, so the override runs with nothing declared.
q: For `class D(B, C)` where both inherit from `A`, what does `super()` in `B` call?
a: `C`'s method. `D.__mro__` is `(D, B, C, A, object)`, and `super()` calls the next class in the MRO of the instance's type, so from `B` the next class is its sibling `C`, not its parent `A`.
q: Which two methods make a class a full `collections.abc.Sequence`?
a: `__getitem__` and `__len__`. Inherit from `Sequence` and implement those two — handling a `slice` in `__getitem__` if you want slicing — and it supplies `__contains__`, `__iter__`, `__reversed__`, `index` and `count`.
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
