---
title: Checkpoint — Greedy algorithms and exchange proofs
minutes: 45
seo-title: Greedy Algorithms Practice Test: Timed Exchange Proof Quiz
description: A timed 45-minute greedy practice test: exchange arguments, earliest finish, event sweeps and tie order, when greedy fails, and a tasks-and-deadlines problem.
q: How do you order tasks to maximise the sum of deadline minus finish time?
a: Do the shortest tasks first. The deadlines add the same total in any order, so only the sum of finish times matters, and swapping an adjacent longer-then-shorter pair always lowers it. Sort by duration and accumulate in `long long`.
q: How do you test a greedy rule quickly?
a: Write a brute force that tries every order or subset for n up to about 8, run both on a few thousand random small inputs and compare. A wrong greedy usually fails within seconds, long before a contest penalty.
---
A timed checkpoint on greedy algorithms: choosing a rule, proving it with an exchange argument, sweeping events with the right tie order and recognising when a problem needs DP instead.

**How it works.** Ten questions and one program, in **45 minutes** from when you start the timer. Clear 70% of the questions and get the program accepted on every hidden case to complete the module.

**Before you start**, make sure you can answer these from memory:

- The exchange argument for activity selection, in two sentences.
- Why earliest start and shortest first fail for activity selection.
- How the tie order of events changes between inclusive and half-open intervals.
- A coin system where largest-coin-first is wrong, and what solves it.
- Why shortest-duration-first maximises the sum of deadline minus finish time.
