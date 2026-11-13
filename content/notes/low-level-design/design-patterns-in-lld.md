---
title: Design Patterns in LLD
order: 3
minutes: 6
level: intermediate
updated: 2026-11-14
seo-title: Design Patterns for LLD Interviews, Applied
description: The six design patterns LLD rounds use most, each tied to a real use: Strategy pricing, Observer displays, State machines, Factory, Singleton, Decorator.
question: Which design patterns are used most in low-level design interviews?
answer: Strategy, Observer, State, Factory, Singleton and Decorator cover most low-level design rounds. Strategy swaps a rule such as pricing, Observer notifies displays of a change, State models a vending machine or an order, Factory creates the right subclass from a type, Singleton guards one shared registry, and Decorator stacks optional add-ons. Use each only where a requirement is likely to change.
q: How do I know which design pattern to use in an LLD round?
a: Look for the part of the requirement that will change or vary. A rule with several versions points to Strategy, many parties reacting to one event to Observer, behaviour that depends on a status to State, and creating one of several subclasses from input to Factory.
q: What is the difference between Strategy and State?
a: Both put behaviour behind an interface. In Strategy the client picks the object and the strategies know nothing of each other. In State the object changes its own state as events happen, and each state usually decides which state comes next.
q: Should I use Singleton for the parking lot class?
a: Only if the problem says there is exactly one lot per process, and even then pass the instance to the classes that need it. Singleton is global state, which hides dependencies and makes tests share data, so many interviewers prefer you to justify it.
q: Is it bad to use too many patterns in an LLD interview?
a: Yes. A pattern adds classes and indirection, so each one should answer a change you can name from the requirements. Interviewers mark down a design that wraps every class in a factory or interface for no stated reason.
q: When is Decorator better than inheritance?
a: When features combine freely. With three optional add-ons, subclasses would need one class per combination, while decorators wrap one object in any number of add-ons in any order at run time.
---

Patterns are named answers to changes you can predict. In an LLD round, reach for one when a requirement says "rules vary", "others must be told" or "behaviour depends on status".

The intent and structure of each are in [Design Patterns](/notes/oop/design-patterns); this note is where they land in a design.

## Strategy: rules that vary

- **Use**: pricing, discount, spot allocation, payment method.
- A context holds the rule behind an interface and can swap it at run time.
- A new rule is a new class: the open/closed principle from [SOLID](/notes/oop/solid-principles).

@figure strategy-pricing

## Observer: tell everyone who cares

- **Use**: display boards, notifications, stock alerts, auction bids.
- The subject keeps a list of observers and calls `update` on each.
- The subject never knows what an observer does with the news.

@figure observer-displays

## State: behaviour follows status

- **Use**: vending machine, ATM, elevator, order lifecycle, traffic light.
- One class per state; the machine delegates every call to its current state.
- Each state decides the next state; no `if (status == …)` chains.

@figure vending-state

## Factory: one place to create

- **Use**: vehicles from a type, payment methods, notification channels.
- Callers ask for a type and get back the interface.
- A new subclass changes the factory only.

@figure factory-vehicles

## Decorator: stackable add-ons

- **Use**: ticket add-ons, pizza toppings, coffee extras, logging around a service.
- Each decorator is the same interface and wraps one inner object.
- Any combination at run time, without a subclass per combination.

@figure decorator-addons

## Singleton: exactly one

- **Use**: an ID generator, a configuration, a registry that must be unique.
- Private constructor and one access point.
- Prefer passing the instance in; a global is hard to test and hides dependencies.

```game
type: match
title: Pattern to LLD problem
prompt: Match each pattern to the design problem it solves.
- Strategy => parking fees change between hourly, flat and event pricing
- Observer => the entrance board and the app must update when a spot frees up
- State => a vending machine reacts to a button differently with and without a coin
- Factory => the gate turns a vehicle type string into the right object
- Decorator => a ticket can add EV charging, valet, both or neither
- Singleton => every ticket number must come from one shared counter
why: Each pattern answers one kind of change: a varying rule, many listeners, status-driven behaviour, object creation, combinable extras and a single shared instance.
```

## Choosing one

| Signal in the requirement | Pattern |
| --- | --- |
| "different ways to compute X" | Strategy |
| "notify", "subscribe", "alert" | Observer |
| "in state A it does X, in B it does Y" | State |
| "create a … based on type" | Factory |
| "optional extras in any combination" | Decorator |
| "only one … in the system" | Singleton |

```game
type: pick
title: Which pattern?
prompt: Each round is a requirement. Pick the pattern it calls for.
? An elevator ignores the door button while moving, but opens when idle.
- Strategy
* State
- Observer
> The same call behaves differently by status, and the elevator moves between statuses itself.
? Users can pay by card, UPI or wallet, and more methods will be added.
* Strategy
- Decorator
- Singleton
> Interchangeable algorithms behind one interface, chosen per payment.
? When a bid is placed, every watcher of the auction is told the new price.
- Factory
- State
* Observer
> One subject, many listeners that subscribe and unsubscribe.
? A notification can be sent by email, SMS or push, picked from a setting string.
* Factory
- Decorator
- Observer
> Turning a type name into the right object is creation, which belongs in one factory.
```

## Interview questions

- **Strategy or State for an order that moves from placed to shipped?** State: the order changes its own status and each status allows different actions.
- **How does Observer avoid tight coupling?** The subject depends only on the observer interface.
- **What does a factory buy you?** Callers never name concrete classes, so adding one touches one place.
- **When not to use a pattern?** When nothing in the requirements is going to change there.

Next: [Design an LRU Cache](/notes/low-level-design/design-an-lru-cache) · Before this: [UML Class Diagrams for LLD Interviews](/notes/low-level-design/uml-class-diagrams)
