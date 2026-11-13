---
title: Checkpoint — Parking lot
minutes: 30
seo-title: Parking Lot LLD Quiz: Strategy, Factory and Best-Fit Practice
description: Practise parking lot design: ten questions on composition, the Strategy and Factory patterns, fees and concurrency, plus a multi-level lot with tariffs to code.
q: Which patterns does a parking lot design use?
a: Strategy twice — one interface chooses the spot and another prices the stay — and a Factory that turns a vehicle type into a vehicle and refuses unknown ones. The lot depends only on the two interfaces, so new rules arrive as new classes.
q: How do you stop two cars taking the last spot at once?
a: Make finding a spot and taking it a single atomic step, with a lock in one process or a conditional update in a database. The second caller then sees the spot taken and gets another one or none.
---
This checkpoint covers the module: composition of lot, levels and spots; a vehicle type that carries the size it needs; the vehicle factory; best-fit allocation; tickets; and a pricing strategy that can be switched while the lot runs.

**How it works.** Ten questions and one program. You need 70% on the questions and the program accepted to clear the module.

**The program** puts both lesson programs together: several levels, best fit, tickets with entry hours, and hourly or flat pricing. Before you code, check your design against these:

- Which class decides *which spot*, and which decides *how much*?
- Where is the rule "a car fits a medium or large spot" written — once?
- What does `park` return when nothing fits, and what does it throw?

Hidden cases switch the tariff between two departures, fill a level so a vehicle moves up, and charge a vehicle that leaves in the hour it arrived.
