---
title: UML Class Diagrams for LLD Interviews
order: 2
minutes: 5
level: beginner
updated: 2026-11-14
seo-title: UML Class Diagram Relationships for LLD, Animated
description: UML class diagrams for low-level design interviews: class box notation, visibility, the six relationships, multiplicity and a library example built up.
question: What is a UML class diagram?
answer: A UML class diagram shows the classes of a design, their fields and methods, and the relationships between them. Each class is a box with three compartments: name, fields and methods, each member prefixed with its visibility. Lines between boxes show association, aggregation, composition, inheritance, realization and dependency, with multiplicity such as 1 or 0..* at the ends.
q: What do the symbols +, -, # and ~ mean in a UML class diagram?
a: They give a member's visibility. A plus is public, a minus is private, a hash is protected (the class and its subclasses) and a tilde is package-private. A common default is private fields and public methods.
q: What is the difference between aggregation and composition in UML?
a: Both mean a whole has parts. Aggregation, a hollow diamond at the whole, means the parts can exist on their own, like members of a library. Composition, a filled diamond, means the parts are created and destroyed with the whole, like rooms of a house.
q: What is the difference between inheritance and realization?
a: Inheritance, a solid line with a hollow triangle, means a class extends another and is a kind of it. Realization, a dashed line with a hollow triangle, means a class implements an interface and promises its methods.
q: What does multiplicity mean in a class diagram?
a: Multiplicity says how many objects can sit at one end of a relationship: 1 exactly one, 0..1 optional, 0..* or * any number, 1..* at least one, or a range like 0..3. It is a rule the code must enforce.
q: When should I use a dependency instead of an association?
a: Use an association when a class keeps a reference to the other as a field. Use a dependency, a dashed arrow, when it only uses the other briefly, as a parameter, a local variable or a return value.
---

A class diagram is the shared sketch of an LLD round: who the classes are, what they hold, and how they relate. Learn the notation once and you can draw any design in minutes.

## The class box

- Three compartments: **name**, **fields**, **methods**.
- A member is `visibility name: type`; a method adds `(params): returnType`.
- Visibility: `+` public, `-` private, `#` protected, `~` package.
- Interfaces and abstract classes carry a stereotype: `«interface»`, `«abstract»`.

@figure class-box-anatomy

## The six relationships

| Relation | Line | Means |
| --- | --- | --- |
| Association | solid, open arrow | holds a reference |
| Aggregation | hollow diamond at whole | has parts that live on |
| Composition | filled diamond at whole | parts die with the whole |
| Inheritance | solid, hollow triangle | is a kind of |
| Realization | dashed, hollow triangle | implements an interface |
| Dependency | dashed, open arrow | uses briefly |

@figure relations

```game
type: match
title: Relation to meaning
prompt: Match each UML relationship to what it says about the code.
- Association => keeps a reference to the other as a field
- Aggregation => a whole holds parts that can live on their own
- Composition => parts are created and destroyed with the whole
- Inheritance => the subclass is a kind of the parent
- Realization => the class implements an interface
- Dependency => uses the other only as a parameter or local
why: The line style and the end marker carry the meaning: diamonds for whole and part, triangles for kinds and interfaces, dashes for weaker links.
```

## Multiplicity

- Written at each **end** of a line: how many objects sit there.
- `1` exactly one, `0..1` optional, `0..*` or `*` any, `1..*` at least one, `0..3` a range.
- Read across the line: "one Member has 0..3 Loans".
- It is a rule: the code must refuse what the diagram forbids.

@figure multiplicity

## A worked example: a library

Requirement: members join a library and borrow its books, at most three at a time; overdue loans are fined.

@figure library-model

- Aggregation, not composition, where parts outlive the whole.
- An interface (`Borrowable`) at the point where new kinds will arrive.
- A dependency for helpers that keep no reference.

## Drawing it in an interview

- Start with names only; add fields and methods as use cases need them.
- Draw only what you will discuss: skip getters, setters and constructors.
- Put multiplicity on the lines that carry a business rule.
- When unsure between aggregation and association, say why you chose; reasoning matters more than notation.

## Interview questions

- **Aggregation or composition for a car and its engine?** Composition if engines are never moved between cars in this system; aggregation if they are tracked and reused.
- **Where does the diamond go?** On the whole, never the part.
- **How do you show an abstract method?** In italics, or with `{abstract}`; in an interview, the `«abstract»` stereotype on the class is enough.
- **What does 0..* next to Book mean?** Any number of books, including none, at that end.

Next: [Design Patterns in LLD](/notes/low-level-design/design-patterns-in-lld) · Before this: [Introduction to Low-Level Design](/notes/low-level-design/introduction-to-low-level-design)
