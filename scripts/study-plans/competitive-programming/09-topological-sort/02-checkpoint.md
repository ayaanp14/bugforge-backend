---
title: Checkpoint — Topological sort and DAGs
minutes: 45
seo-title: Topological Sort Practice Test: Kahn's Algorithm, DAG DP
description: A timed topological-sort checkpoint: ten questions on Kahn's algorithm, cycles and DP over a DAG, then the fewest semesters and counting paths in a DAG in C++.
q: How do you find the minimum number of semesters to finish all courses?
a: Run Kahn's algorithm and give every course a level: a course with no prerequisites is level 1, and each edge `u → v` sets `level[v] = max(level[v], level[u] + 1)`. The answer is the largest level, or -1 when a cycle stops some course from being placed.
q: How do you count the paths from 1 to n in a DAG?
a: Set `ways[1] = 1` and process the vertices in topological order, adding `ways[u]` to `ways[v]` for every edge `u → v`, modulo 10^9 + 7. Each path is counted once, by its last edge.
---
A 45-minute timed checkpoint on module 9: topological orders, Kahn's algorithm and its cycle test, and dynamic programming in topological order.

**How it works.** Ten questions and two programs, in 45 minutes from when you start the timer. 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer these from memory:

- When a topological order exists, and how Kahn's algorithm proves it does not.
- What a min-heap instead of a queue changes about the order.
- Why every path into `u` is final when `u` comes up in topological order.
- How longest path, number of paths and fewest semesters each become one relaxation per edge.

The programs are the fewest semesters to finish every course (or -1 on a cycle), and the number of paths from 1 to n in a DAG modulo 10^9 + 7.
