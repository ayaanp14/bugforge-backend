---
title: Checkpoint — STL containers
minutes: 25
seo-title: C++ STL Containers Quiz: Vector, Map and Iterators Practice
description: Test your C++ STL containers knowledge: 13 questions and three programs — a BFS grid walk, an LRU cache from a list and a hash map, and a map leaderboard.
q: What does `push_back` do to iterators when `size() == capacity()`?
a: It reallocates: the vector allocates a larger block, moves or copies every element into it and frees the old one, so every iterator, pointer and reference into the vector is invalidated. Reserve capacity in advance or keep indices instead.
q: What does `m[key]` do when the key is absent?
a: It inserts the key with a value-initialised value — `0` for numbers, an empty string — and returns a reference to it. To look up without inserting, use `find`, `count`, `contains` or `at`.
q: When does a `std::priority_queue` comparator return `true`?
a: When its first argument has lower priority than its second, meaning it should come out later. That is why the default `std::less` gives a max-heap with the largest element on top, and `std::greater` gives a min-heap.
---
This checkpoint covers the whole module: the container families and the complexity table, `std::vector`'s size–capacity model and the erase–remove idiom, `std::deque`, `std::list` and the adaptors, `std::map`/`std::set` with `lower_bound`, the unordered containers and the sort-before-printing rule, and iterators with the invalidation table.

**How it works.** Thirteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Which operation is O(1) on a `std::list` but O(n) on a `std::vector`, and what must you already hold for it to be O(1)?
- What does `push_back` do to every iterator into a vector when `size() == capacity()`?
- Why does `std::stack::pop()` return `void`?
- When does a `std::priority_queue` comparator return `true`?
- What does `m[key]` do when `key` is absent, and which calls look up without inserting?
- Why must an `std::unordered_map` be sorted before it is printed?
- What is the one correct shape of an erase-while-iterating loop?

The three programs are a breadth-first search over a grid with `std::queue`, an LRU cache built from a `std::list` and an `std::unordered_map` of iterators, and a leaderboard kept in a `std::map` and a `std::set` with a custom comparator.
