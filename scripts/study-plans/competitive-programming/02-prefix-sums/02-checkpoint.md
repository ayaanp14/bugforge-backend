---
title: Checkpoint — Prefix sums and difference arrays
minutes: 45
seo-title: Prefix Sum and Difference Array Practice Test in C++
description: A timed 45-minute check on prefix sums and difference arrays: range-sum indexes, range updates, 2D prefix sums, and a million-hour timeline problem.
q: What does the prefix sums checkpoint test?
a: Building and indexing a prefix array, writing range updates into a difference array, choosing between them, 2D prefix sums, and one program — the busiest hour of a long booking timeline — judged at contest limits.
---
The prefix sums checkpoint. It is timed: **45 minutes** from when you start it.

**What it covers.** Prefix arrays and their indexes (`p[r] − p[l − 1]`), difference arrays (`d[l] += v`, `d[r + 1] −= v`), when each applies and when neither does, 2D prefix sums, and counting subarrays with a hash map of prefixes.

**How it works.** Eleven questions and one program. Clear 70% of the questions and get the program accepted. The program's timeline is a million hours long and the bookings run into the thousands, so adding each booking hour by hour runs out of time.

**Before you start**, make sure you can say from memory:

- why the prefix array has a `p[0]` and the difference array a slot `n + 1`;
- which tool fits "many queries", "many updates", and both mixed;
- the four-term formula for a rectangle's sum.
