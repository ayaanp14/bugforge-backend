---
title: Introduction to Low-Level Design
order: 1
minutes: 5
level: beginner
updated: 2026-11-14
seo-title: Low-Level Design (LLD) Interview: What It Is, How
description: What a low-level design or machine-coding round asks, how LLD differs from HLD, a seven-step approach from requirements to code, and what gets graded.
question: What is low-level design in a software interview?
answer: Low-level design is the round where you turn a small problem, such as a parking lot or an LRU cache, into classes, their relations and working code. You clarify requirements, pick entities from the nouns and methods from the verbs, draw a class diagram, apply patterns where change is expected, write the code and walk a use case through it. Interviewers grade extensibility, SOLID and readable code.
q: What is the difference between HLD and LLD?
a: High-level design decides the services, databases, caches and queues of a whole system and how they talk. Low-level design zooms into one component and decides its classes, interfaces, relations and method signatures, usually down to running code.
q: What is a machine-coding round?
a: It is a low-level design round where you must also write working code, typically in 60 to 120 minutes, for a problem such as a parking lot, a snake and ladder game or a splitwise clone. The code is judged on structure and extensibility as much as on whether it runs.
q: How do I start a low-level design question?
a: Ask questions before drawing anything. Pin down the use cases, the actors, the scale of each entity and what is out of scope, then list the nouns and verbs in the agreed requirements. Those become your first classes and methods.
q: Which design patterns matter most for LLD interviews?
a: Strategy, Observer, State, Factory, Singleton and Decorator come up most because LLD problems keep needing swappable rules, notifications, state machines and object creation. Use a pattern when it solves a change you can name, not to show it off.
q: Do I need UML for an LLD interview?
a: You need enough UML to draw a class diagram quickly: a box per class with fields and methods, and lines for inheritance, interfaces, composition and association. Nobody grades notation details, but a clear diagram makes your design easy to follow and discuss.
---

Low-level design (LLD) turns a small, concrete problem into **classes, relations and working code**. Many companies run it as a *machine-coding* round: about an hour to design and code.

## What the round asks

- A bounded problem: parking lot, elevator, LRU cache, movie booking, splitwise.
- A class diagram, then code that runs one or two use cases.
- Discussion: "what if we add a new vehicle type?", "what if two users book the same seat?".

## HLD vs LLD

| | High-level design | Low-level design |
| --- | --- | --- |
| Unit | Services, databases, queues | Classes, interfaces, methods |
| Question | What runs where, how it scales | How the code is structured |
| Output | Box-and-arrow architecture | Class diagram and code |
| Graded on | Scale, availability, trade-offs | Extensibility, SOLID, clarity |

@figure hld-to-lld

## The approach

1. **Clarify requirements**: use cases, actors, limits, what is out of scope.
2. **Find entities and behaviours**: nouns become classes, verbs become methods.
3. **Draw the class diagram**: fields and methods per class.
4. **Add relations**: inheritance, composition, association, with multiplicity.
5. **Apply patterns** where a requirement is likely to change.
6. **Write the code**: core classes first, then a small `main`.
7. **Walk a use case** through the code to prove it works.

@figure nouns-to-classes

- An actor (driver, admin) is outside the system; it calls methods, it is not a class.
- Put a method on the class that owns the data it needs.

```game
type: order
title: The LLD approach
prompt: Put the steps of a low-level design answer in order.
- Clarify requirements and scope
- List nouns and verbs as classes and methods
- Draw the class diagram
- Add relations and multiplicity
- Apply patterns where change is expected
- Write the code
- Walk a use case through it
why: You cannot pick classes before the requirements are fixed, relations need the classes, and code comes last so the walk-through tests the design you agreed on.
```

## Growing the model

Start from the class the use cases enter through, then add one class at a time.

@figure model-grows

- **Composition** when the part dies with the whole (floor in a lot).
- **Abstract class or interface** where new kinds will arrive (vehicles).
- Keep each class small: one reason to change ([SOLID](/notes/oop/solid-principles)).

@figure walk-a-use-case

## What interviewers grade

- **Extensibility**: a new type is a new class, not a new `if`.
- **SOLID**: small classes, interfaces at the points of change.
- **Readable code**: clear names, no god class, no global state.
- **Correctness**: the use case runs; edge cases (lot full, double booking) are handled.
- **Communication**: you state assumptions and trade-offs aloud.

## Interview questions

- **How is LLD different from HLD?** HLD places services and data stores; LLD designs the classes inside one of them.
- **Where do you start?** With questions: use cases, actors and scope, before any class.
- **How do you find the classes?** Nouns in the agreed requirements; verbs become methods.
- **When do you use a design pattern?** When a named requirement is likely to change, such as pricing rules or notification targets.
- **What makes a design extensible?** New behaviour arrives as a new class behind an existing interface.

Next: [UML Class Diagrams for LLD Interviews](/notes/low-level-design/uml-class-diagrams)
