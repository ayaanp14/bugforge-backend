---
title: Elevator system: one car, then a dispatcher
minutes: 14
seo-title: Elevator System Design in Java: LOOK and a Dispatcher
description: Code an elevator system in Java for a machine-coding round: a TreeSet of stops, direction as state, LOOK scheduling and a dispatcher for two cars.
question: How do you code an elevator system in a machine-coding round?
answer: Give each Elevator its floor, a direction (up, down or idle) and a sorted set of stops, and let a LOOK rule move it: keep the direction while a stop lies ahead, turn when none does, go idle when none is left. A Dispatcher sends each hall call to the nearest car that is idle or already heading towards it.
q: Why store an elevator's stops in a TreeSet?
a: A `TreeSet` keeps the stops sorted and drops duplicates, so "is there a stop above me?" is one `higher(floor)` call and "below me?" one `lower(floor)`, each O(log n). A list needs a scan, and a queue serves calls in arrival order and zigzags.
q: When does a LOOK elevator change direction?
a: Only when no stop lies ahead in its current direction. A call behind the car waits until the sweep it is on ends, which stops the car zigzagging and still reaches every floor within two sweeps.
q: What is the difference between a hall call and a car call in code?
a: A hall call goes to the Dispatcher, which chooses an elevator; a car call is pressed inside one elevator and goes straight into that elevator's stops. In code that is two entry points, such as `dispatcher.call(floor)` and `elevator.press(floor)`.
q: Why does an idle elevator need a direction as soon as it is assigned a call?
a: The dispatcher reads direction to decide who answers the next call. A car left idle after taking a call still looks free, so the next call may be piled onto it, or sent the wrong way, before it has even moved.
---
An elevator is the machine-coding problem where an object model has to carry a **scheduling rule**. The exercises grow it the way a round does: one car first, then two cars and a dispatcher. The [elevator system note](/notes/low-level-design/design-an-elevator-system) has the full design; this lesson is the part you type.

## The classes

- **Elevator**: `floor`, `dir` and `stops`, a `TreeSet<Integer>`. Sorted, so the next stop above is `stops.higher(floor)` and below is `stops.lower(floor)`; a repeated call vanishes on its own.
- **Direction**: an enum `UP`, `DOWN`, `IDLE`. It is the car's **state**: it decides which stops count as ahead.
- **Dispatcher**: owns the cars and answers hall calls. A car call, pressed inside, skips it and goes straight to its car.
- **Scheduler**: the rule for the next stop, behind an interface so LOOK, SCAN or first come first served can be swapped ([Strategy](/notes/low-level-design/design-patterns-in-lld)).

## One tick at a time

A simulation moves time in ticks. On each `STEP` a car does exactly one thing:

1. No stops: it is idle and says so.
2. A stop at the floor it is on: the doors open, nothing moves.
3. Otherwise it moves one floor in its direction, and stops if that floor was asked for.

Then LOOK settles the direction: **keep it while a stop lies ahead, turn when none does, go idle when none is left.**

@figure look-steps

## The traps

- **Nearest stop first.** Short to write, and it starves: a busy cluster near the car keeps winning while a far floor waits for ever. LOOK never turns while a stop lies ahead, so a call behind the car waits one sweep at most. In the figure, the call for 3 came in behind the car; it waited for the turn and was served on the way down.
- **The idle car.** Give it a direction the moment it takes its first call, or the dispatcher still sees it as free and keeps piling calls on it.
- **Moving in the wrong place.** The dispatcher chooses, the car moves. A dispatcher that edits floors is the mixed responsibility interviewers look for.

```game
type: pick
title: What does the next STEP print?
prompt: The car runs LOOK and moves one floor per STEP. Pick the line the next STEP prints.
? At 4 going UP, stops at 6 and 2.
* UP to 5
- DOWN to 3
- stop at 4
> A stop lies ahead at 6, so the car keeps its direction and moves one floor up.
? At 6 going DOWN after stopping there; the only stop left is 2.
* DOWN to 5
- UP to 7
- idle at 6
> Nothing lay above 6, so LOOK turned the car as it stopped. It moves down towards 2.
? Idle at 3; CALL 3 just came in.
* stop at 3
- UP to 4
- idle at 3
> A stop at the floor the car is on is served without moving.
? At 2 going DOWN, stops at 1 and 8; CALL 5 arrives.
* DOWN to 1: stop
- UP to 3
- DOWN to 1
> 5 is behind the car, so it waits for the turn. Floor 1 lies ahead and is a stop.
```

## Dispatching

The dispatcher's rule, in order:

1. Among cars that are idle or already heading towards the floor, take the nearest.
2. If none is, take the nearest car anyway; it serves the call after it turns.
3. Ties go to the lower-numbered car, so the output is deterministic.

A car call never goes through these steps: it belongs to the car it was pressed in, even when the floor is behind it.
