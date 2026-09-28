---
title: Checkpoint — Interfaces
minutes: 22
seo-title: Java Interfaces Quiz: Default Methods and Sealed Types Test
description: Test your Java interface skills with 12 questions and two programs on default and static methods, functional interfaces, Comparable, Iterable and sealed types.
q: What are the three rules for resolving two default methods with the same signature?
a: First, a method defined in the class or a superclass wins over any interface default. Second, a more specific interface wins over one it extends. Otherwise the class must override the method itself, and may call a chosen default with `Swimmer.super.move()`.
q: What must `next()` do when an iterator has no more elements?
a: Throw `NoSuchElementException`. A call to `next()` without a preceding successful `hasNext()` must never make up a value, and each call to `iterator()` should return a fresh, independent iterator.
q: What makes an interface functional in Java?
a: Having exactly one abstract method; defaults, statics and redeclared `Object` methods do not count. `@FunctionalInterface` makes the compiler enforce that, so a second abstract method becomes a compile error rather than breaking the lambdas that implement the interface.
---
This checkpoint covers interface basics, default/static/private methods and conflict resolution, functional interfaces, `Comparable` and `Iterable`, and sealed interfaces.

**How it works.** Twelve questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- What an interface may contain, and why implementing methods must be `public`.
- The three rules for resolving two defaults with the same signature.
- What makes an interface functional, and what `@FunctionalInterface` enforces.
- Why `compareTo` should agree with `equals`, and which collections rely on it.
- What `Iterable` requires, and what `next()` must do past the end.
- What `sealed … permits` buys, and the modifiers a permitted type needs.

The programs are an `Iterable` type with a natural order, and a strategy-style interface implemented by several small classes and a lambda.
