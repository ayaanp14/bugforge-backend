---
title: Checkpoint — STL containers
minutes: 25
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
