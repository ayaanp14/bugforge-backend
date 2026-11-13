---
title: Checkpoint — Segment trees and Fenwick trees
minutes: 60
seo-title: Segment Tree and Fenwick Tree Quiz: C++ Practice Test
description: A timed practice test on segment trees and Fenwick trees: point updates, range queries, i & -i, inversion counting, and a range-add, range-sum program in C++.
q: How do you support range add and range sum with Fenwick trees?
a: Keep two Fenwick trees B1 and B2. Adding x to [l, r] is four point updates: B1 gets +x at l and −x at r + 1, B2 gets +x·(l − 1) at l and −x·r at r + 1. The prefix sum up to i is then sum(B1, i) · i − sum(B2, i), and a range is a difference of two prefixes.
q: How many nodes does a segment tree need?
a: With the recursive layout (children 2v and 2v + 1, root 1), allocate 4n slots: the tree has at most 2·2^⌈log2 n⌉ − 1 nodes, which is below 4n for every n. A bottom-up iterative tree needs exactly 2n.
---
A timed checkpoint on the module: segment trees (build, point update, range query, the identity for an outside node), Fenwick trees (`i & -i`, the climb and the descent, ranges as two prefixes), counting with a tree indexed by value, and choosing between them and plain prefix sums.

**How it works.** Sixty minutes from the moment you start the timer: ten questions and one program. 70% on the questions and the program accepted clears the module.

**Before you start**, make sure you can answer these from memory:

- Which nodes a query for `[l, r]` takes whole, and what an outside node returns for a sum and for a minimum.
- What `i & -i` is for 12, and which cells `add(5, x)` and `sum(7)` touch when n = 8.
- Why a minimum query cannot be answered as `sum(r) − sum(l − 1)`.
- How compressing values to ranks turns "earlier elements greater than x" into a prefix count.

The program is range add with range sum: two Fenwick trees, every value in `long long`.
