---
title: Checkpoint: Elevator system
minutes: 25
seo-title: Elevator System LLD Quiz: LOOK, SCAN and Dispatch Practice
description: Practise the elevator machine-coding problem with ten design questions and a Java program that runs LOOK, SCAN and first come first served as strategies.
q: Is LOOK always better than SCAN?
a: LOOK travels no further than SCAN on the same stops, because it skips the empty ride to the end of the shaft. SCAN's fixed sweep makes the worst-case wait easier to bound, which is why textbooks still teach both.
q: Which design patterns does an elevator system use?
a: Strategy for the scheduling policy, State for the direction (and door states in a fuller design), and Observer for floor displays that follow each car. The dispatcher is sometimes a Singleton, though injecting it is easier to test.
q: How do you make an elevator simulation testable?
a: Drive it with explicit ticks instead of real time, break every tie by a fixed rule such as the lower car number, and print each decision. The same script then always produces the same output, which a test can compare line by line.
---
This checkpoint covers the module: the elevator's classes, direction as state, LOOK, dispatching hall calls, and the scheduling policy as a Strategy.

**How it works.** Ten questions and one program. You need 70% on the questions and the program accepted to clear the module. Retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does a LOOK car do when no stop lies ahead of it?
- How is SCAN different from LOOK, and when do they travel the same distance?
- Which cars may the dispatcher pick first, and what happens when none qualifies?
- Why does a car call skip the dispatcher?
- Where does the scheduling rule live, so a new policy changes no other class?

The program is the Strategy pattern at work: three policies behind one interface, the same stops served three ways. Work one line through by hand before you code it; the turn at the end of the shaft is where most wrong answers come from.
