---
title: Iterators and invalidation — the contract behind every loop
minutes: 14
---
An iterator is a generalised pointer: something you can dereference to reach an element and increment to reach the next one. Every container hands them out through `begin()` and `end()`, every algorithm in `<algorithm>` takes a pair of them, and the range-based `for` of Module 3 is sugar over them. What makes them more than pointers is that each container promises a *category* — how far and in which directions its iterators can move — and an *invalidation rule* — which operations on the container leave existing iterators pointing at garbage. This lesson covers the categories and what they cost, the helper functions `std::next`, `std::prev`, `std::distance` and `std::advance`, `const_iterator` and reverse iterators, the invalidation table, the one correct way to erase while iterating, and iterator ranges as the interface algorithms share.

## Categories

| Category | Can do | Containers |
| --- | --- | --- |
| input / output | read or write once, move forward | streams (`std::istream_iterator`) |
| forward | read/write, `++`, multi-pass | `std::forward_list`, the unordered containers |
| bidirectional | forward plus `--` | `std::list`, `std::set`, `std::map` and their `multi` forms |
| random access | bidirectional plus `it + n`, `it[n]`, `it - it2`, `<` | `std::deque` |
| contiguous (C++17) | random access, and elements are adjacent in memory | `std::vector`, `std::array`, `std::string`, built-in arrays |

Each category includes the ones above it. The category is what decides the cost of an operation: `it + 5` is one addition on a vector and does not compile on a list; `std::sort` needs random access, which is why `std::list` has its own `sort()` member; `std::lower_bound` on a `std::set` compiles but walks linearly (lesson 4). C++20 spells these categories as concepts — `std::random_access_iterator` and friends — and Module 14 uses them.

## begin, end, const and reverse

`begin()` points at the first element and `end()` one past the last; the range is half-open, `[begin, end)`, so an empty container has `begin() == end()` and dereferencing `end()` is undefined behaviour. The iterator type is `Container::iterator` — spelt `auto` in practice — and its `const_iterator` cousin refuses writes. `cbegin()`/`cend()` always give the const form, and calling `begin()` on a `const` container (or through a `const&` parameter) gives it too. `rbegin()`/`rend()` walk backwards: `*rbegin()` is the last element, and `rit.base()` converts back to a forward iterator that points one past `*rit`.

```cpp
#include <algorithm>
#include <iostream>
#include <iterator>
#include <vector>

int main() {
    std::vector<int> v{10, 20, 30, 40};
    for (auto it = v.cbegin(); it != v.cend(); ++it) std::cout << *it << ' ';        // 10 20 30 40
    for (auto rit = v.rbegin(); rit != v.rend(); ++rit) std::cout << *rit << ' ';   // 40 30 20 10
    auto third = std::next(v.begin(), 2);                 // → 30, without changing v.begin()
    auto last = std::prev(v.end());                       // → 40
    std::cout << '\n' << *third << ' ' << *last << ' '
              << std::distance(v.begin(), last) << '\n';  // 30 40 3
    std::advance(third, -1);                              // third now → 20 (moved in place)
    std::cout << *third << ' ' << *std::max_element(v.begin(), v.end()) << '\n';  // 20 40
    return 0;
}
```

`std::next(it, n)` and `std::prev(it, n)` return a moved copy; `std::advance(it, n)` moves the iterator you pass; `std::distance(a, b)` counts the steps from `a` to `b`. On a random-access iterator all four are O(1) arithmetic; on a bidirectional or forward iterator they *step*, so `std::distance(s.begin(), s.find(k))` on a `std::set` is O(n) and `std::next(l.begin(), 1000)` on a list is a thousand hops. Prefer them to hand-written `it + 2` because they compile on every category and say what they mean.

## The invalidation table

An operation **invalidates** an iterator when the element it pointed to has moved, been destroyed, or — for `end()` — is no longer where the end is. Using an invalidated iterator is undefined behaviour: it usually reads stale memory and sometimes appears to work, which is what makes the table worth learning rather than discovering.

| Container | `push_back`/`insert` | `erase` |
| --- | --- | --- |
| `std::vector`, `std::string` | if it reallocates: everything; otherwise every iterator at or after the insertion point (and `end()`) | every iterator at or after the erased element, and `end()` |
| `std::deque` | insert at an end: all iterators, no references; insert in the middle: everything | erase at an end: only the erased element (and `end()` for the back); in the middle: everything |
| `std::list`, `std::forward_list` | nothing | only the erased element |
| `std::set`, `std::map` (and `multi`) | nothing | only the erased element |
| `std::unordered_*` | if it rehashes: every iterator, no references; otherwise nothing | only the erased element |

Two rules cover most of it. Node-based containers (list, set, map, unordered) keep an element's iterator valid until *that element* is erased — a rehash being the one exception for the unordered ones. Contiguous containers (vector, string, deque in the middle) invalidate everything from the point of change onwards, and a growing vector invalidates everything full stop. The practical habit: never hold an iterator or reference into a vector across a call that can change its size; hold an index, or `reserve` first.

## Erasing while iterating

The classic bug:

```cpp
for (auto it = v.begin(); it != v.end(); ++it) {
    if (*it % 2 == 0) v.erase(it);        // it now points past the removed slot — and ++it skips one;
}                                          // at the last element it steps past end(): undefined behaviour
```

`erase` on every container returns an iterator to the element *after* the one removed, and that return value is the whole idiom:

```cpp
for (auto it = v.begin(); it != v.end(); ) {
    if (*it % 2 == 0) it = v.erase(it);   // erase advances for us
    else ++it;                            // only advance when we did not erase
}
```

The same loop is correct on a `std::map` (`it->second`), a `std::list`, a `std::set` and an unordered container, which is why it is the one to memorise. Two variants exist. `m.erase(it++)` — post-increment produces the old iterator for `erase` after stepping past it — works on node-based containers only, because on a vector the stepped iterator is itself invalidated by the erase; do not write it for a container you might later change. And since C++20, `std::erase_if(c, pred)` does the whole job for any standard container in one call (lesson 2); use it whenever the decision is a pure predicate on the element, and keep the explicit loop for when the body needs to do something else with each erased element, such as print it or move it somewhere.

The mirror image — inserting into a container while iterating it — has no safe idiom on a vector at all (each insert can reallocate). Collect the additions in a second container and append after the loop, or iterate by index up to a size captured before the loop.

## Iterator ranges as the algorithm interface

Every algorithm in `<algorithm>` and `<numeric>` takes `[first, last)` rather than a container, and that decision is what lets one `std::sort` serve a vector, a deque, a string and a built-in array, and let it work on *part* of a container:

```cpp
#include <algorithm>
#include <numeric>

std::vector<int> v{5, 3, 9, 1, 7};
std::sort(v.begin(), v.begin() + 3);                        // 3 5 9 1 7 — only the first three
auto nine = std::find(v.begin(), v.end(), 9);               // an iterator, or v.end() if absent
long long sum = std::accumulate(v.begin(), v.end(), 0LL);   // 25 — 0LL so the sum is a long long
v.erase(std::unique(v.begin(), v.end()), v.end());          // adjacent duplicates removed
std::ranges::sort(v);                                       // C++20: the container is the range
```

The range convention, the categories and the invalidation rules are the three things Module 14 assumes; the exercises there are written against iterator pairs and, in the last lesson, against C++20 ranges, which are the same idea with the pair packaged as one object.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `*v.end()` or `--v.begin()` | Undefined behaviour; the range is half-open |
| `v.erase(it)` inside a `for (…; ++it)` | Skips the next element; runs off the end on the last one |
| `it = v.erase(it)` *and* `++it` in the same iteration | Skips one element after every erase |
| `m.erase(it++)` on a vector | The incremented iterator was invalidated by the erase |
| `auto it = v.begin(); v.push_back(x); *it` | Dangling after a reallocation |
| `it + 2` on a `std::list` or `std::set` iterator | Does not compile; `std::next(it, 2)` |
| Comparing iterators from two different containers | Meaningless; undefined behaviour |
| `std::distance(s.begin(), it)` on a large set in a loop | O(n) per call; count as you go instead |

## Key takeaways

- Iterators come in categories — forward (unordered), bidirectional (list, set, map), random access (deque), contiguous (vector, string, array) — and the category fixes what `+ n` and the algorithms may do.
- `[begin, end)` is half-open; `cbegin`/`cend` are read-only; `rbegin`/`rend` walk backwards; `std::next`/`prev`/`distance`/`advance` are O(1) only on random access.
- Node-based containers keep an iterator valid until its element is erased (a rehash aside); a vector invalidates everything from the change point and everything on reallocation.
- Erase while iterating with `it = c.erase(it)` and advance only in the `else`; use `std::erase_if` when the decision is a pure predicate.
- Algorithms take `[first, last)` so one implementation serves every container and any sub-range.
