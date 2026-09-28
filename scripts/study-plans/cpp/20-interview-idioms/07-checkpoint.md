---
title: Final checkpoint — Interview idioms
minutes: 30
seo-title: C++ Interview Quiz: LRU Cache, Pitfalls and Theory Practice
description: The final C++ practice test: 15 questions and three classic interview programs — an LRU cache, a shunting-yard evaluator and a polymorphic shape store.
q: How do you implement an LRU cache in C++?
a: Combine a `std::list` of key–value pairs, ordered from most to least recently used, with a `std::unordered_map` from each key to its list iterator. A hit moves the node to the front with `splice` in O(1) without invalidating any iterator; an insert past capacity evicts the back node and erases its key from the map.
q: Why does a hand-written destructor lose the move operations?
a: A user-declared destructor, copy constructor or copy assignment suppresses the implicitly generated move constructor and move assignment, so the class falls back to copying wherever it could have moved. Declare the moves explicitly — the rule of five — or write none of the five and let the members manage themselves.
q: What does `Base b = derived;` keep?
a: Only the `Base` part: the derived members and the dynamic type are sliced off, and virtual calls on `b` run the base versions. Store polymorphic objects by reference, pointer or `std::unique_ptr<Base>` instead, and give the base a virtual destructor so deleting through a `Base*` destroys the whole object.
---
The last checkpoint of the C++ plan. It covers the contest template and its costs, the STL idiom sheet, the pitfalls review pass, `Vec<T>` and the hash map by hand, clean-solution habits and the theory drill — and, being the last one, it reaches back across the whole track.

**How it works.** Fifteen questions and three programs; 70% on the questions and every program accepted clears the module. With every other module complete, that also completes the plan.

**Before you start**, make sure you can answer these from memory:

- What `1LL * a * b` fixes that `(long long)(a * b)` does not, and why `-7 % 3` is `-1`.
- Why `i < v.size() - 1` runs on an empty vector, and what `map[key]` does inside a condition.
- The rule of five in one sentence, and why a hand-written destructor silently loses the moves.
- Why `push_back` is amortised O(1), and what a reallocation invalidates.
- What `Base b = derived;` keeps, and why deleting through a base pointer needs a virtual destructor.
- Which container gives an O(1) `splice`, and what `std::endl` does that `'\n'` does not.

The three programs are the classics interviewers set: an LRU cache from `std::list` and `std::unordered_map`, a shunting-yard evaluator with two stacks, and a polymorphic shape store behind `std::unique_ptr`.
