---
title: std::map and std::set — the ordered containers
minutes: 14
---
`std::map` and `std::set` are balanced binary trees (red–black trees in every mainstream implementation) that keep their elements sorted by key. Everything about them follows from that: lookup, insertion and erasure are O(log n); iteration visits the elements in key order for free; and "the first key not less than k" is a single call, which is the question a hash table cannot answer at all. This lesson covers the interface that matters — `operator[]` and the insertion it hides, `find`/`count`/`contains`, what `insert` returns, `emplace` and `try_emplace`, `lower_bound`/`upper_bound`, in-order iteration with structured bindings — then custom comparators, the `multi` variants, and `extract`/`merge` in brief.

## The model

A `std::set<Key>` holds unique keys; a `std::map<Key, T>` holds unique keys, each with a value, stored as `std::pair<const Key, T>`. The key is `const` because changing it in place would break the tree's ordering. Ordering comes from a comparator, `std::less<Key>` by default, so the key type needs `operator<` (or a comparator you supply); `std::string`, the arithmetic types, `std::pair` and `std::tuple` all qualify. Each element is a separately allocated node, so — as with `std::list` — iterators, pointers and references to an element stay valid until that element is erased, no matter how many others are inserted.

```cpp
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> stock{{"pear", 4}, {"apple", 7}};
    stock["fig"] = 12;                    // inserts fig
    stock["apple"] += 1;                  // updates apple
    for (const auto& [name, qty] : stock) {
        std::cout << name << ' ' << qty << '\n';   // apple 8, fig 12, pear 4 — key order
    }
    return 0;
}
```

## operator[] inserts

`m[key]` returns a reference to the value for `key`, *inserting a value-initialised element first if the key is absent* — `0` for numbers, an empty string, an empty vector. That is exactly right for counting (`++counts[word]`) and grouping (`groups[key].push_back(x)`), and exactly wrong for looking up: `if (m["ghost"] == 0)` has just created `ghost`. It also means `operator[]` is not available on a `const std::map` (it cannot insert) and requires the value type to be default-constructible. For a lookup that must not insert, use `find`, `count`, `contains` (C++20) or `at` (throws `std::out_of_range` when absent):

```cpp
if (auto it = stock.find("kiwi"); it != stock.end()) std::cout << it->second;   // no insertion
if (stock.contains("fig")) std::cout << stock.at("fig");                          // C++20
std::cout << stock.count("pear");   // 0 or 1 in a map; the "how many" form for a multimap
```

The `if` with initialiser (Module 3, lesson 1) keeps the iterator scoped to the test.

## insert, emplace and what they return

`insert` and `emplace` never overwrite. They return a `std::pair<iterator, bool>`: the iterator points at the element with that key (new or pre-existing) and the `bool` says whether an insertion happened. Reading that `bool` is how "first time we have seen this key" is written without a separate lookup:

```cpp
std::map<std::string, int> ids;
auto [where, inserted] = ids.insert({"ada", 1});     // inserted == true
auto [again, second] = ids.insert({"ada", 2});       // second == false; ada is still 1
std::cout << again->second << '\n';                   // 1
ids.emplace("bob", 2);                                // constructs the pair in place
ids.try_emplace("bob", 99);                           // C++17: does nothing, bob stays 2
ids.insert_or_assign("bob", 3);                       // C++17: overwrites; bob is 3
```

`try_emplace` matters when constructing the value is expensive: unlike `emplace`, it builds nothing at all when the key exists. `insert_or_assign` is the spelling of "put" that overwrites and still reports, through its `bool`, whether the key was new. On a `std::set`, `s.insert(x).second` is the one-line membership-and-add.

## lower_bound and upper_bound

`lower_bound(k)` returns an iterator to the first element whose key is **not less than** `k`; `upper_bound(k)` to the first whose key is **greater than** `k`; both return `end()` when there is none, and `equal_range(k)` gives both at once. They are the reason to choose an ordered container: "the next departure at or after 09:30", "the largest key below x", "every key in [lo, hi)" are all one or two calls:

```cpp
std::set<int> departures{600, 645, 700, 900};
auto next = departures.lower_bound(650);          // → 700
auto prevIt = departures.lower_bound(650);
if (prevIt != departures.begin()) --prevIt;        // → 645, the last key < 650
for (auto it = departures.lower_bound(640); it != departures.upper_bound(700); ++it) {
    std::cout << *it << ' ';                       // 645 700 — the keys in [640, 700]
}
```

Use the **member** versions. The free `std::lower_bound(s.begin(), s.end(), k)` from `<algorithm>` compiles on a set but walks it linearly, because a tree iterator is bidirectional, not random access — O(n) instead of O(log n).

## Erasing

`m.erase(key)` removes the element with that key and returns how many it removed (0 or 1 for a map or set); `m.erase(it)` removes the element at an iterator and returns the iterator after it; `m.erase(first, last)` removes a range. Erasing invalidates only iterators to the erased element, which is what makes the `it = m.erase(it)` loop of lesson 6 safe, and `std::erase_if(m, pred)` (C++20) removes every element matching a predicate on the pair.

## Custom comparators

The third template argument decides the order. `std::greater<Key>` reverses it; a struct with a `const operator()` (a functor, Module 11, lesson 4) orders by anything you like. The comparator must be a **strict weak ordering**: irreflexive (`comp(a, a)` is false), so `<=` is never correct — a comparator that returns `true` for equal keys corrupts the tree and the symptoms are lost elements and infinite loops.

```cpp
struct ByLengthThenText {
    bool operator()(const std::string& a, const std::string& b) const {
        if (a.size() != b.size()) return a.size() < b.size();
        return a < b;
    }
};
std::set<std::string, ByLengthThenText> words{"pear", "fig", "apple", "kiwi"};
// fig kiwi pear apple

std::map<std::string, int, std::less<>> byName;    // transparent comparator
byName.find(std::string_view{"ada"});               // looks up without building a std::string
```

`std::less<>` — the transparent comparator, C++14 — lets `find`, `count`, `lower_bound` and `contains` take anything comparable with the key (a `std::string_view`, a `const char*`) without constructing a temporary `std::string`. It is worth writing by default for string-keyed maps.

## multiset and multimap

The `multi` variants allow equal keys and keep them in insertion order among themselves. `insert` always succeeds and returns a plain iterator; `count(k)` is the number of matches; `equal_range(k)` yields the run of them; `erase(k)` removes **all** of them — erase one with `erase(find(k))`. A `std::multiset<int>` is a sorted bag that supports "remove one copy of x" in O(log n), which makes it the standard choice for a running median or a sliding-window minimum with deletions.

## extract and merge, in brief

C++17 added node handles. `m.extract(key)` (or `extract(it)`) unlinks the node and returns a handle that owns it; the handle's `key()` is *mutable*, so a key can be changed and the node put back with `m.insert(std::move(handle))` — no copy of the value, no reallocation. `a.merge(b)` moves every node of `b` whose key is absent from `a` into `a`, leaving the duplicates in `b`. Both are rare in everyday code and common in interview follow-ups.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `if (m[key] == 0)` to test presence | Inserts `key` with `0`; use `find`, `count` or `contains` |
| `m[key]` on a `const std::map&` parameter | Does not compile; use `find` or `at` |
| Expecting `insert` to overwrite | It keeps the old value; use `m[k] = v` or `insert_or_assign` |
| `std::lower_bound(s.begin(), s.end(), k)` on a set | Correct but O(n); call `s.lower_bound(k)` |
| A comparator using `<=` | Not a strict weak ordering; the tree misbehaves |
| `for (auto [k, v] : m)` | Copies every pair; `const auto& [k, v]` reads, `auto& [k, v]` modifies `v` |
| `ms.erase(x)` on a multiset to remove one copy | Removes all copies; `ms.erase(ms.find(x))` |

## Key takeaways

- `std::map`/`std::set` are balanced trees: O(log n) find, insert and erase; iteration is in key order; elements are `pair<const Key, T>` nodes whose iterators survive other insertions.
- `operator[]` inserts a value-initialised element when the key is absent — right for counting, wrong for lookups; use `find`, `count`, `contains` or `at`.
- `insert`/`emplace` never overwrite and return `{iterator, bool}`; `try_emplace` skips construction, `insert_or_assign` overwrites.
- Member `lower_bound`/`upper_bound` answer "first key ≥ k" and "first key > k" in O(log n) — the reason to pick an ordered container.
- A comparator is a strict weak ordering (never `<=`); `std::less<>` allows heterogeneous lookup; `multi` variants keep duplicates and `erase(key)` removes them all.
