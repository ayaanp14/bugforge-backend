---
title: Checkpoint — Inheritance & polymorphism
minutes: 24
---
This checkpoint covers `extends` and constructor chaining, the rules of overriding and hiding, dynamic dispatch and casting, the `Object` methods and their contract, abstract classes and the template method, and the composition-versus-inheritance judgement.

**How it works.** Fourteen questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- What the first statement of every constructor is, and why `class B extends A {}` can fail to compile.
- The rules for a valid override, and why `equals(Point)` is wrong.
- What runs for `Account a = new SavingsAccount(); a.monthEnd();`, and for a static method called the same way.
- What happens on a failed downcast, and what `instanceof` says about `null`.
- The `equals`/`hashCode` contract and what breaks if you override only one.
- What a template method is, and one reason to prefer composition.

The programs are a small class hierarchy with polymorphic dispatch, and a value class whose `equals`/`hashCode` are exercised through a `HashSet`.
