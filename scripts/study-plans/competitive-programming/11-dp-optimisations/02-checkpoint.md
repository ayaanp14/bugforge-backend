---
title: Checkpoint — DP optimisations
minutes: 60
seo-title: DP Optimization Quiz: Prefix Sums, Deque and Bitmask DP Test
description: A timed practice test on DP optimisations in C++: prefix-sum transitions, the monotonic deque, bitmask DP and its limits, and a travelling-salesman program.
q: How does the bitmask DP for the travelling salesman problem work?
a: Let dp[mask][v] be the cheapest path that starts at city 0, visits exactly the cities in mask and ends at v. Start from dp[1][0] = 0; from each state, move to any city u outside mask. The answer is the minimum of dp[full][v] + d[v][0]. It costs O(2^n · n²) time and O(2^n · n) memory.
q: Why are masks processed in increasing numeric order?
a: Every transition adds a bit, so the new mask is numerically larger than the old one. Looping masks from 0 upwards therefore finishes every state before any state that extends it is read — the same reason a 1-D DP loops i upwards.
---
A timed checkpoint on the module: prefix sums over the previous row, the monotonic deque for a window maximum, the cost arithmetic that says when an optimisation is needed, and DP over subsets.

**How it works.** Sixty minutes from the moment you start the timer: ten questions and one program. 70% on the questions and the program accepted clears the module.

**Before you start**, make sure you can answer these from memory:

- The prefix-sum form of `dp[i−1][k−c] + … + dp[i−1][k]`, and why the difference needs `+ MOD`.
- Which deque entries are popped from the back, and why that is safe.
- How many states and transitions the TSP bitmask DP has at n = 12, and at what n it stops fitting.
- How to test and set bit j of a mask.

The program is the shortest round trip through up to 12 cities.
