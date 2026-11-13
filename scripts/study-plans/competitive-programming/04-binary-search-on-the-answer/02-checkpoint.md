---
title: Checkpoint — Binary search on the answer
minutes: 45
seo-title: Binary Search on the Answer Practice Test: Timed C++ Quiz
description: A timed 45-minute practice test on binary search on the answer: monotone checks, bounds, rounding mid, overflow in the check and factory machines.
q: How do you choose hi in a binary search on the answer?
a: Pick a value you can prove is feasible from the statement's limits. For the factory problem, the fastest machine alone makes t products in `min(k) * t` seconds, so that time certainly works. If `hi` might be infeasible, the search returns it anyway and the answer is wrong.
q: Why can the check in a binary search on the answer overflow?
a: The check often sums values derived from the guess, like `T / k_i` over every machine. With `T` near 10^18 two such terms already pass the `long long` range. Stop summing as soon as the target is reached, or cap each term.
---
A timed checkpoint on binary search on the answer: recognising the shape, proving the bounds, the two loop templates and the overflow traps.

**How it works.** Ten questions and one program, in **45 minutes** from when you start the timer. Clear 70% of the questions and get the program accepted on every hidden case — including answers near 10¹⁸ — to complete the module.

**Before you start**, make sure you can answer these from memory:

- What makes a yes/no check monotone, and why that is what binary search needs.
- The first-yes template (`hi = mid`, `lo = mid + 1`) and the last-yes template (`lo = mid`, `hi = mid - 1`, `mid` rounded up).
- How to prove `lo` and `hi` from the constraints.
- Why a sum inside the check can overflow `long long`, and how to stop it.
- How many checks a range of 10⁹ or 10¹⁸ takes.
