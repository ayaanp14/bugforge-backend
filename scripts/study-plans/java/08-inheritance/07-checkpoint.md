---
title: Checkpoint — Inheritance & polymorphism
minutes: 24
seo-title: Java Inheritance Quiz: Overriding and Polymorphism Practice
description: Test your Java inheritance skills with 14 questions and two programs on super, overriding, dynamic dispatch, casting, equals and hashCode, and abstract classes.
q: Why can `class B extends A {}` fail to compile in Java?
a: `B` gets a default constructor whose first statement is an implicit `super()`. If `A` declares only constructors with parameters, such as `A(int)`, that call matches nothing, so `B` must declare a constructor that calls `super(...)` with arguments.
q: Why is `equals(Point p)` wrong in Java?
a: It overloads `equals` instead of overriding `Object.equals(Object)`, so `HashSet`, `List.contains` and `Objects.equals` never call it and fall back to identity. The parameter must be `Object`; `@Override` turns this mistake into a compile error.
q: What runs for `Account a = new SavingsAccount(); a.monthEnd();`?
a: `SavingsAccount`'s override of `monthEnd`, because instance methods dispatch on the object's runtime class. A static method called the same way would run `Account`'s version, since static methods are hidden, not overridden, and resolved by the reference's declared type.
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
