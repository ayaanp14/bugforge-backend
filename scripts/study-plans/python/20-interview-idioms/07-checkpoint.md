---
title: Final checkpoint — Interview idioms
minutes: 30
seo-title: Python Interview Prep Quiz: Idioms, Pitfalls and LRU Cache
description: A final Python interview practice test: 15 questions and three programs on fast input, sliding windows, pitfalls, LRU caches, hash maps, stacks and intervals.
q: Which pattern is "longest subarray with at most k distinct" values?
a: A sliding window. Advance the start index while the window holds more than k distinct values, tracking counts in a dict or `Counter` and deleting a key when its count reaches zero; each element enters and leaves once, so the scan is O(n).
q: What makes get, put and eviction all O(1) in an LRU cache?
a: A dict maps each key to a node in a doubly linked list ordered by use, so a node can be found, unlinked and moved to the tail in O(1), and the least recently used entry is always at the head. `OrderedDict.move_to_end` and `popitem(last=False)` do exactly that.
q: What are -7 // 2 and -7 % 2 in Python?
a: `-4` and `1`. Floor division rounds towards negative infinity, and the remainder takes the divisor's sign, so that `(a // b) * b + a % b == a` always holds.
q: Why does `sys.stdin.buffer.read().split()` beat `input()` in a loop?
a: It reads the whole input in one call as bytes, with no per-line call and no decoding, and `int()` accepts the byte tokens directly. It matters for large inputs such as 10⁵ lines; for a few lines, `input()` is fine and clearer.
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
