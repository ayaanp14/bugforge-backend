---
title: Checkpoint — Disjoint set union
minutes: 45
seo-title: DSU Practice Test: Union-Find, Kruskal's MST in C++
description: A timed union-find checkpoint: ten questions on path compression, union by size and cycles, then Kruskal's MST and online connectivity in C++.
q: How does Kruskal's algorithm use a DSU?
a: Sort the edges by weight and take them cheapest first; an edge joins the tree only when `unite` succeeds, meaning its endpoints were in different components. After n − 1 successful unites the edges taken form a minimum spanning tree; fewer means the graph is disconnected.
q: Why is the answer to Kruskal's algorithm a long long?
a: A spanning tree has n − 1 edges, and with weights up to 10^9 just three of them already sum past 2^31. Accumulate the total in `long long` from the start.
---
A 45-minute timed checkpoint on module 7: the DSU, its two speed rules, and the problems it solves.

**How it works.** Ten questions and two programs, in 45 minutes from when you start the timer. 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer these from memory:

- What `find` returns, and what path compression changes on the way back.
- Why union by size keeps every tree at most log2 n tall.
- What `unite` returning `false` means for an edge of a graph.
- How Kruskal's algorithm decides whether to take an edge, and how it knows the graph was disconnected.

The programs are Kruskal's minimum spanning tree with weights up to 10^9, and a stream of union and "same set?" queries answered online.
