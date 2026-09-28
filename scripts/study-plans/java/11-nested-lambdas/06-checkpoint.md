---
title: Checkpoint — Nested classes & lambdas
minutes: 22
seo-title: Java Lambdas Quiz: Inner Classes and Method References Test
description: Practise Java nested classes and lambdas with 12 questions and two programs on inner and anonymous classes, effectively final captures and method references.
q: What does an inner class instance hold that a static nested class does not?
a: A hidden reference to its enclosing outer instance, `Outer.this`. It lets the inner object read the outer's fields, and it also keeps the outer object reachable for as long as the inner one is — a common memory leak.
q: What kind of method reference is `String::length`?
a: An unbound instance method reference: the first parameter of the target function becomes the receiver, so it means `s -> s.length()`. By contrast `prefix::startsWith` is bound — it captures the `prefix` object when the reference is created.
q: What does `this` mean inside a lambda compared with an anonymous class?
a: In a lambda `this` is the enclosing instance, because a lambda introduces no new `this` of its own. In an anonymous class `this` is the anonymous object itself.
q: How do you return a function that remembers an argument in Java?
a: Return a lambda that captures the method's parameter, as `startsWith(String prefix)` returning `s -> s.startsWith(prefix)` does. Each call yields a closure holding its own `prefix`.
---
This checkpoint covers static nested versus inner classes, local and anonymous classes, lambda syntax and semantics, the four kinds of method reference, and functions as values.

**How it works.** Twelve questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- What an inner class instance holds that a static nested one does not, and why that leaks.
- Why captured locals must be effectively final.
- What `this` means inside a lambda versus inside an anonymous class.
- Which kind of reference `String::length` is, and what `prefix::startsWith` captures.
- How to return a function that remembers an argument.

The programs are a higher-order text pipeline built from composed functions, and an iterator implemented as an inner class alongside a lambda-based strategy table.
