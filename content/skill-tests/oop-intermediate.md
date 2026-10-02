---
updated: 2026-10-03
question: What does the OOP (Intermediate) skill test cover?
answer: It certifies object-oriented design and the edge cases of dynamic dispatch — hidden static methods, fields that are not polymorphic, constructors that call overridable methods, object slicing, Python's method resolution order — together with the SOLID principles, composition over inheritance, association, aggregation and composition, and the classic design patterns. Questions show Java, Python or C++ code, or describe a design, and every one is multiple choice.
q: Do I need to know Java, Python and C++ for the OOP Intermediate test?
a: You need to read all three, not write them. Questions show short programs in Java, Python or C++ and name the language whenever the answer depends on it. The rules that differ between them — static methods, `virtual`, multiple inheritance, Python's method resolution order — are part of what the test examines, so preparing in one language alone leaves gaps.
q: Which design patterns are on the OOP Intermediate test?
a: Singleton (including making it thread-safe), Factory Method, Abstract Factory, Builder, Strategy, Observer, Decorator, Adapter, Template Method, Command and dependency injection. You are asked to recognise a pattern from code or a description, to choose one for a stated problem, and to tell apart patterns that look alike, such as Decorator and Adapter or Strategy and Template Method.
q: Is there any coding in the OOP Intermediate test?
a: No. Every question is multiple choice, and a few ask you to select every correct option. Many show code and ask what it prints, whether it compiles or what a change would break; the rest describe a design in words and ask which principle or pattern applies.
q: Should I pass OOP Basic before sitting OOP Intermediate?
a: Neither test requires the other. Intermediate assumes everything Basic examines — the four pillars, constructors, overloading against overriding — and does not explain it again. If you can already predict what a three-class hierarchy prints in all three languages, start with Intermediate.
q: How is this different from the Java Intermediate test?
a: Java (Intermediate) examines the whole language at work level — collections, generics, streams, concurrency, the JVM — and ends with a problem you solve in Java. OOP (Intermediate) examines only object-oriented design and dispatch, across Java, Python and C++, with no coding round. They certify different things, and you can hold both.
---

The OOP (Intermediate) test certifies that you can design with objects, not only write them. It assumes the four pillars and asks what comes after: where dynamic dispatch stops applying, what a class hierarchy promises the code that uses it, how objects should hold one another, and which of the well-known designs fits a problem. Every question is about something concrete — a short class hierarchy, a proposed refactoring, a requirement written as a few sentences — and asks what happens, what breaks, or which design keeps the rule.

Code appears in Java, Python and C++, chosen where the languages disagree. The same few lines can run the parent's method in one language and the child's in another, or copy an object in C++ where Java and Python copy a reference. A question always names its language, and where an answer depends on a convention, such as what a UML diamond means, the question states the convention.

## Who the test is for

It suits a developer who has worked in an object-oriented codebase: you have extended someone else's class, been surprised by a subclass that did not behave like its parent, and argued about whether something should be an interface. You should read code in all three languages at the level of a small hierarchy with an interface or two, and know SOLID and the common patterns well enough to apply them to a design you have not seen before, not just define them. The questions are multiple choice and there is no coding round; a few ask you to select every correct option, and only the exact set scores.

## What each topic examines

- **Classes and objects.** Equality against identity done properly: what the `equals`/`hashCode` contract requires and what goes wrong in a hash-based collection when it is not kept, value objects against entities, shallow against deep copies, and what assignment copies in each language.
- **Encapsulation.** Invariants kept in one place, getters that leak mutable internals, read-only views against copies, immutability and defensive copying, `const` in C++, Python properties, and the Law of Demeter.
- **Constructors and object lifecycle.** Initialisation order across a hierarchy, a constructor that calls an overridable method and so runs subclass code on a half-built object, `this` escaping a constructor, virtual calls during C++ construction and destruction, the rule of three, virtual destructors, `__new__` against `__init__`, and static factory methods.
- **Inheritance.** Python's method resolution order and cooperative `super()` in a diamond, how each language treats the diamond, object slicing in C++, the fragile base class problem, and what a class that allows subclassing owes its subclasses.
- **Polymorphism.** Which calls are dispatched on the object and which are fixed at compile time: static methods are hidden rather than overridden, fields are not polymorphic, private methods are not overridden, and an overload is chosen from declared types before an override is chosen from the object. Also covariant return types, and `virtual` against non-virtual calls in C++.
- **Abstraction and interfaces.** Abstract classes against interfaces in modern Java, Python's `abc` against `typing.Protocol`, C++ pure virtual functions and the non-virtual interface idiom, and interfaces that leak an implementation detail.
- **Relationships.** Association, aggregation and composition told apart by ownership and lifetime, in UML's notation (a filled diamond for composition, a hollow one for aggregation, a dashed arrow for a dependency), coupling and cohesion, and composition over inheritance.
- **SOLID principles.** Each principle applied to a concrete design: which one a change breaks, and which one a refactoring serves. The Liskov Substitution Principle gets the closest reading — preconditions and postconditions, and why the classic rectangle and square do not fit into one hierarchy.
- **Design patterns.** Singleton and its thread-safety, Factory Method, Abstract Factory, Builder, Strategy, Observer, Decorator, Adapter, Template Method, Command and dependency injection: recognised from code, chosen for a problem, and told apart from their look-alikes.

Your result breaks the score down by these topics and links each one to somewhere to practise. The [Java](/study-plans/java), [Python](/study-plans/python) and [C++](/study-plans/cpp) study plans teach classes, interfaces and inheritance with exercises that run on the judge, and the [Programming Fundamentals MCQs](/aptitude/programming-fundamentals) are good practice at predicting a program's output against the clock.

## How to prepare

Write the small programs. For each dispatch rule above, write a pair of classes that shows it, predict the output, run it, then port it to the other two languages and see what changes. When a prediction is wrong, find the rule you missed and put it in one sentence — "the compiler picks the overload, the object picks the override" — then test the sentence on a new case.

For the design questions, practise naming the principle from the symptom. Every new file format needing another branch in the same `switch` points at Open/Closed. One class that changes whenever either the tax rules or the PDF layout change points at Single Responsibility. A subclass that callers must check for before they use it points at Liskov. A business rule that cannot be unit-tested without the real email server points at Dependency Inversion. Do the same for patterns: for each one, be able to say what problem it solves, what it looks like in ten lines, and which pattern it is most often mistaken for, and why.

Then read real code with that vocabulary in mind. The Java standard library shows several of these ideas in use — the `java.io` streams are decorators stacked on one another, and a `Comparator` passed to a sort is a strategy — and asking what each design choice costs is good practice for the questions that compare two designs.

## Where candidates lose marks

- **Applying the wrong rule to a member.** Overloads, static methods, fields and C++ non-virtual functions follow the declared type; overrides follow the object. Many wrong answers come from applying one rule to the other kind of member.
- **Assuming a subclass is a subtype.** Code that compiles can still break every caller that relied on the parent's behaviour.
- **Treating Python's `super()` as "my parent".** It is the next class in the method resolution order of the object the method was called on.
- **Choosing a diamond by closeness.** Ownership and lifetime decide between aggregation and composition, not how closely two classes are related.
- **Picking a pattern by its shape.** Decorator, Adapter and Proxy all wrap an object, and Strategy and Template Method both vary a step. Ask what interface the wrapper offers and how the variation is supplied.

## Coming from OOP Basic

[OOP (Basic)](/skill-tests/oop-basic) examines the four pillars and their mechanics: constructors, overloading against overriding, and basic polymorphism. Intermediate assumes all of that and builds on it rather than testing it again. If you also want a language credential, [Java (Intermediate)](/skill-tests/java-intermediate), [Python (Intermediate)](/skill-tests/python-intermediate) and [C++ (Intermediate)](/skill-tests/cpp-intermediate) examine the whole language and end with a problem to solve in it.

## Sample question
topic: classes-objects
answer: B
run: python

What does this Python program print?

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

@dataclass
class Pixel(Point):
    color: str = "black"

a = Point(1, 2)
print(a == Point(1, 2), a == Pixel(1, 2), a is Point(1, 2))
```

- A: `True True False`
- B: `True False False`
- C: `True True True`
- D: `False False False`

> `@dataclass` writes an `__eq__` that compares the fields, but only when both objects are of exactly the same class; otherwise it returns `NotImplemented`. So two `Point(1, 2)`s are equal, while a `Point` and a `Pixel` with the same coordinates are not: both sides decline, and `==` falls back to identity, which is false. `is` always compares identity, and two separate objects are never the same one. Comparing exact classes keeps equality symmetric, at the price of a subclass never equalling its base.
