---
title: Checkpoint — Classes and objects
minutes: 25
seo-title: Python Classes Quiz: Magic Methods, Properties and Dataclasses
description: Test your Python classes with 12 questions and three programs on self and attributes, magic methods, properties, class methods, dataclasses and class design.
q: What does `obj.method(x)` become, and why is `self` the first parameter?
a: It becomes `Class.method(obj, x)`: attribute lookup finds the function on the class and binds it to the instance, and the call passes that instance as the first argument. Every method therefore declares `self` first to receive it.
q: Which dunders make `len(x)`, `x in c`, `for e in c` and `3 * x` work?
a: `__len__` for `len(x)`, `__contains__` for `in`, `__iter__` for a `for` loop — `__getitem__` alone also gives iteration — and `__rmul__` for `3 * x`, the reflected call Python tries after `int.__mul__` returns `NotImplemented`.
q: What does `@dataclass(frozen=True)` give you that the default does not?
a: Immutability and hashing: assigning a field after construction raises `FrozenInstanceError`, and the generated `__hash__` lets instances serve as dict keys and set members. A default dataclass is mutable and, because it defines `__eq__`, unhashable.
---
This checkpoint covers the whole module: the `class` statement with `__init__`, `self`, instance and class attributes, the dunder methods that make a class behave like a built-in, `@property` and the encapsulation conventions with `__slots__`, class methods as alternative constructors and static methods, dataclasses with their options and `__post_init__`, and the design discipline of invariants and small interfaces.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does `obj.method(x)` become, and why is `self` the first parameter?
- Why is `members = []` in a class body a bug, and where does per-instance state belong?
- What must `__eq__` return for a foreign type, and what happens to `__hash__` when `__eq__` is defined?
- Which dunders make `len(x)`, `x in c`, `for e in c` and `3 * x` work?
- Why does a `from_…` class method call `cls(...)` rather than the class by name?
- What does `@dataclass(frozen=True)` give you that the default does not?
- Where does validation go in a dataclass, and in a hand-written class?

The three programs are a `Fraction` value type with arithmetic, comparison and hashing dunders, a bank ledger whose accounts enforce invariants and are built through class-method constructors, and a frozen dataclass catalogue with derived fields, sorting and `replace`.
