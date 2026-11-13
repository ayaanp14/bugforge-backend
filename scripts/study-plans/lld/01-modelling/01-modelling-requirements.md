---
title: From requirements to classes
minutes: 12
seo-title: How to Model Classes From Requirements in LLD Interviews
description: Turn a machine-coding problem into classes: nouns become classes, verbs become methods, a Loan links Book and Member, and each rule lives with its data.
question: How do you turn requirements into classes in a low-level design interview?
answer: Fix the requirements first, then read them for nouns and verbs. Nouns that hold state become classes, verbs become methods on the class that owns the data they need, and a fact that belongs to two objects, such as a loan's due date, becomes a class of its own. Actors who use the system stay outside it.
q: Should an actor such as a librarian be a class?
a: Usually not. A librarian or a driver is someone who calls the system's methods; they become a class only when the system must remember something about them, such as an admin's permissions. Modelling every actor as a class adds objects that hold no state.
q: What is an association class in LLD?
a: It is a class that stands for a link between two objects and carries the facts of that link. A Loan joins one Book and one Member and holds the due date, which belongs to neither on its own; the book and the member each point at their loans.
q: Where should a method go in a class design?
a: On the class that owns the data the method needs. Whether a loan is overdue is decided from its due date, so `overdueOn(day)` belongs on Loan, not on Library. A method that reaches into another object's fields to decide something is a sign it sits on the wrong class.
q: What is a god class and how do I avoid it?
a: A god class is one class that holds every map and every rule, so every change touches it. Keep the coordinating class thin: it finds objects and calls them, while each entity checks its own rules, such as a book refusing a second loan.
---
A machine-coding round opens with a paragraph of requirements and a blank editor. The first ten minutes decide the next fifty: the classes you pick are the ones you will be coding against. This lesson is the method, and the two programs after it are judged on what your classes do. The theory is in [Introduction to Low-Level Design](/notes/low-level-design/introduction-to-low-level-design) and [UML class diagrams](/notes/low-level-design/uml-class-diagrams).

## Read the requirements for nouns and verbs

> A library lends **books** to **members**. A member may **borrow** up to two books for 14 days and **return** them; the desk can list the books that are **overdue**.

- **Nouns that hold state become classes**: Book (id, title), Member (name, loans), Library (everything on the shelf).
- **Verbs become methods**: `borrow`, `giveBack`, `overdue`.
- **Facts become fields**: the 14-day period and the limit of two are constants, not classes.
- **Actors stay outside**: the person at the desk calls `borrow`; nothing about them is stored, so no Librarian class.

## Give a shared fact its own class

The due day belongs to neither the book nor the member: it belongs to *this book lent to this member*. That is a **Loan**, an association class.

@figure library-classes

- **Composition**: the library owns its books and members.
- **Association**: a Loan points at one Book and one Member; a book has 0..1 loans, a member 0..2.
- **Put each rule with its data**: `overdueOn(day)` reads only the due day, so it lives on Loan. The Library finds objects and calls them; it is not a god class holding every rule.

## Run it

Every command is a method call, and every refusal is a rule some object owns.

@figure borrow-run

- Refusals are **exceptions** with a message, caught once in `main`, so no method returns magic strings.
- Output order never depends on a `HashMap`: books live in a `TreeMap` sorted by id.

```game
type: pick
title: Class, method, field, or nothing?
prompt: Each phrase comes from the library's requirements. Where does it go in the design?
? "the books that are overdue"
- A class Overdue
* A method that asks each loan
- A boolean field on Library
> Overdue is a question about a loan on a given day, so it is a method; storing it would go stale the next day.
? "the librarian at the desk"
- A class Librarian
* Nothing: an actor outside the system
- A field on Book
> The librarian only calls the system's methods and nothing about them is remembered, so no class.
? "borrowed for 14 days"
- A class Period
- A method on Member
* A constant and a due day on Loan
> The 14 is a rule's number, and the due day it produces is a fact of one loan.
? "a member who borrows a book"
- A list of names inside Book
* A Loan joining Book and Member
- A map inside Library only
> The link carries its own fact, the due day, so it earns a class that both sides point at.
```

## The traps

- **Storing derived state**: an `overdue` flag is wrong tomorrow; compute it from the due day.
- **Strings for objects**: `Map<String, String> loans` from book id to member name cannot hold a due day; the first new requirement breaks it.
- **One class doing everything**: if every method of your design is on `Library`, the entities are only records.
