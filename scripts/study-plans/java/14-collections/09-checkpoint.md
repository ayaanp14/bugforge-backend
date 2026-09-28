---
title: Checkpoint — Collections framework
minutes: 26
seo-title: Java Collections Quiz: Lists, Sets, Maps and Queues Test
description: Practise the Java collections framework with 15 questions and two programs on lists, sets, HashMap internals, PriorityQueue, comparators and fail-fast loops.
q: What is the time complexity of get, add and contains on ArrayList, HashSet and TreeMap?
a: `ArrayList`: `get` O(1), `add` at the end O(1) amortised, `contains` O(n). `HashSet`: `add` and `contains` O(1) on average. `TreeMap`: `get`, `put` and `containsKey` O(log n).
q: Does iterating a PriorityQueue give sorted order?
a: No. Only the head is guaranteed to be the smallest element; iteration and `toString` show the heap's internal order. Poll the elements one by one, or copy and sort them, to get them in order.
q: Why use ArrayDeque instead of Stack for a stack in Java?
a: `Stack` extends `Vector`: every method is synchronised, which is slow, and it inherits index methods that break the stack abstraction. `ArrayDeque` gives O(1) `push`, `pop` and `peek` without either problem.
---
This checkpoint covers the framework's structure and complexities, lists, sets, maps and `HashMap` internals, queues and `PriorityQueue`, sorting and comparators, iteration and fail-fast behaviour, and immutable collections and utilities.

**How it works.** Fifteen questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- The complexity of `get`, `add` and `contains` on `ArrayList`, `HashSet` and `TreeMap`.
- How `HashMap.put` finds a bucket and what happens on collision and resize.
- Which class to use for a stack, and why not `Stack`.
- Whether iterating a `PriorityQueue` gives sorted order.
- The four safe ways to remove while iterating.
- The difference between `List.of`, `Arrays.asList` and `Collections.unmodifiableList`.

The programs are a word-frequency report using the modern map API and comparators, and a small task scheduler built on a priority queue and a deque.
