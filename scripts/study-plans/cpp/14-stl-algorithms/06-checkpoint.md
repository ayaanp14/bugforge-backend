---
title: Checkpoint — Algorithms and lambdas
minutes: 25
---
This checkpoint covers the whole module: the half-open range and predicate interface of `<algorithm>` and `<numeric>`, sorting with comparators and stability plus binary search on sorted ranges, `transform`, `accumulate`, `remove_if` and `partition`, lambdas as closure objects with captures, `mutable` and `std::function`, and C++20 ranges with projections and lazy views.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does `std::find` return when nothing matches, and what must you test before dereferencing it?
- Why is a comparator written with `<=` undefined behaviour rather than a wrong order?
- When must you use `std::stable_sort` instead of `std::sort`?
- What does `std::accumulate(v.begin(), v.end(), 0)` compute over a `std::vector<long long>`?
- Why does `std::remove_if` need an `erase` after it?
- What does copying a `mutable` lambda copy?
- Why does `std::views::iota(1) | std::views::take(5)` terminate?

The three programs are a task list ordered by `std::stable_sort` that must keep arrival order within a priority, a median found with `std::nth_element` followed by k-th smallest queries, and a nested-list walker written as a recursive lambda. Read each input format before choosing the algorithm.
