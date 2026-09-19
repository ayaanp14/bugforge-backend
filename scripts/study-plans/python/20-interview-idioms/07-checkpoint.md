---
title: Final checkpoint — Interview idioms
minutes: 30
---
The last checkpoint of the Python plan. It covers the round and the file template, the idiom sheet, the twelve pitfalls, the hash map, dynamic array, LRU cache and heap by hand, clean-solution habits and the theory drill — and, being the last one, it reaches back across the whole track: collections, generators, classes, exceptions, the standard library and the cost model.

**How it works.** Fifteen questions and three programs; 70% on the questions and every program accepted clears the module. With every other module complete, that also completes the plan.

**Before you start**, make sure you can answer these from memory:

- Why `sys.stdin.buffer.read().split()` beats `input()` in a loop, and when it does not matter.
- Which shape "longest subarray with at most k distinct" is, and the idiom for it.
- Why `[[0] * n] * m` is wrong, and why a mutable default argument is shared.
- What makes `get`, `put` and eviction all O(1) in an LRU cache.
- Why a hash map resizes at a load factor, and what that does to the cost of `put`.
- What `-7 // 2` and `-7 % 2` are, and why.
- The one-sentence answers for the GIL, a generator and `is` versus `==`.

The three programs are the classics interviewers set: a sliding-window rate limiter over a stream of timestamps with a deque, an RPN evaluator with a stack, an operator table and per-line error handling, and an interval merger with sorted keys, a coverage total and `bisect` queries.
