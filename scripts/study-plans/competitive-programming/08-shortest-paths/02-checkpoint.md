---
title: Checkpoint — Shortest paths
minutes: 45
seo-title: Shortest Path Practice Test: Dijkstra, BFS, 0-1 BFS in C++
description: A timed shortest-path checkpoint: ten questions on BFS, 0-1 BFS and Dijkstra's lazy deletion, then all-distances Dijkstra and counting shortest paths in C++.
q: How do you count the number of shortest paths with Dijkstra?
a: Keep `ways[v]` beside `dist[v]`. When relaxing `u → v` finds a strictly shorter distance, set `ways[v] = ways[u]`; when it finds an equal one, add `ways[u]` to `ways[v]`. Because vertices settle in distance order, `ways[u]` is final before it is used.
q: Why must the heap pair put the distance first?
a: `std::pair` compares its first member first, so `{dist, vertex}` orders the heap by distance. With `{vertex, dist}` the heap would pop by vertex number and settle vertices at wrong distances.
---
A 45-minute timed checkpoint on module 8: choosing BFS, 0-1 BFS or Dijkstra from the weights, and writing Dijkstra correctly under a clock.

**How it works.** Ten questions and two programs, in 45 minutes from when you start the timer. 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer these from memory:

- Which algorithm fits equal weights, 0/1 weights, non-negative weights, negative weights.
- What `greater<>` does to a `priority_queue`, and why the distance goes first in the pair.
- What the line `if (d > dist[u]) continue;` skips, and why it is safe.
- Why path sums are `long long`, and how an unreachable vertex is printed.

The programs are Dijkstra's distances from vertex 1 to every vertex with weights up to 10^9, and the number of shortest paths to vertex n modulo 10^9 + 7.
