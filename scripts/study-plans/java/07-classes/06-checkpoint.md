---
title: Checkpoint — Classes & objects
minutes: 22
seo-title: Java Classes Quiz: Constructors, Static and Encapsulation Test
description: Test your Java class skills with 12 questions and two programs on new and this, constructors, initialisation order, static members, access and immutability.
q: What does `new` do step by step in Java?
a: It allocates memory for the object on the heap, sets every field to its default (0, false or null), runs the constructor — the super constructor first, then the field initialisers, then the constructor body — and returns a reference to the new object.
q: What happens to the default constructor when you declare a constructor in Java?
a: It disappears. The compiler generates a no-argument default constructor only when a class declares no constructors at all, so once you add any constructor, `new X()` compiles only if you also declare a no-argument one.
q: What is the recipe for an immutable class in Java?
a: No mutators, all fields `private final`, a `final` class, defensive copies of any mutable component on the way in and out, and methods that return a new instance instead of changing the current one.
---
This checkpoint covers the object model, constructors and initialisation order, static members, access modifiers and immutability, and class design.

**How it works.** Twelve questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- What `new` does, step by step, and what `this` is.
- What happens to the default constructor when you declare one.
- The order in which field initialisers and constructor bodies run.
- Why a static method cannot read an instance field.
- The four access levels and what `protected` includes.
- The recipe for an immutable class.

The programs ask you to write two small classes from scratch — an entity with invariants and a value type with `toString` — and drive them from `main`.
