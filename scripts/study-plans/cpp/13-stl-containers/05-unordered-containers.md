---
title: The unordered containers — hashing, buckets and custom keys
minutes: 13
---
`std::unordered_map` and `std::unordered_set` answer the same questions as their ordered cousins — is this key present, what is its value, add it, remove it — in average constant time instead of logarithmic, by hashing the key to a bucket instead of walking a tree. The price is order: iteration visits elements in whatever sequence the table happens to hold them, which changes with the number of elements, the library version and the hash function, so any program that *prints* an unordered container must sort first. This lesson covers how the table works (hash, buckets, load factor, rehashing), the average and worst cases, the interface, the rule for deterministic output, how to make a struct usable as a key, and when to choose ordered over unordered.

## How the table works

An unordered container keeps an array of **buckets**. To store a key it computes `std::hash<Key>{}(key)`, a `std::size_t`, reduces it modulo the bucket count to pick a bucket, and links the element into that bucket's chain. Lookup repeats the hash, walks the one chain and compares with `operator==` (`std::equal_to<Key>`) until it finds the key or the chain ends. With a good hash and enough buckets the chains are short — one or two elements — and every operation is O(1) on average.

The **load factor** is `size() / bucket_count()`. When an insertion would push it past `max_load_factor()` (1.0 by default), the table **rehashes**: it allocates more buckets and re-links every element. Rehashing is O(n) but rare, so insertion stays amortised O(1); it also invalidates every iterator, while pointers and references to elements stay valid because elements are nodes that are re-linked rather than moved. `reserve(n)` sizes the table for `n` elements in advance and removes the rehashes from a loop of known length, exactly as `std::vector::reserve` removes reallocations.

```cpp
#include <iostream>
#include <string>
#include <unordered_map>

int main() {
    std::unordered_map<std::string, int> counts;
    counts.reserve(64);
    for (std::string word; std::cin >> word;) ++counts[word];   // operator[] inserts 0 first
    std::cout << counts.size() << " distinct words\n";
    if (auto it = counts.find("the"); it != counts.end()) std::cout << "the: " << it->second << '\n';
    std::cout << counts.count("zebra") << '\n';                 // 0 — no insertion
    return 0;
}
```

The interface mirrors `std::map`: `operator[]` inserts a value-initialised element, `find`/`count`/`contains` look up without inserting, `insert`/`emplace` return `{iterator, bool}`, `try_emplace` and `insert_or_assign` behave as in lesson 4, `erase(key)` returns the count removed. What is missing is everything that needs order: no `lower_bound`, no `upper_bound`, no comparator, no reverse iterators.

## Average O(1), worst O(n)

The constant-time claim depends on the keys spreading across buckets. If many keys hash to the same bucket — a poor hash function, or an adversary who chose the keys knowing the hash — one chain holds everything and every operation degrades to O(n). `std::hash` for integers is the identity in libstdc++, which is fine for typical data and terrible for keys that are all multiples of the bucket count; `std::hash<std::string>` is a proper mixing function. The practical rule: for untrusted input where a worst case is exploitable, or for a guaranteed bound, use `std::map`; for everything else the unordered container is faster and the constant matters more than the log.

## Iteration order is unspecified

```cpp
std::unordered_set<int> seen{3, 1, 2};
for (int x : seen) std::cout << x << ' ';    // 3 1 2? 2 1 3? — the standard does not say
```

The order is a function of the hash values, the bucket count and the insertion history. It differs between libstdc++ and libc++, between releases, and between a table of ten elements and the same table after a rehash. A program whose output depends on it is not wrong, but it is not deterministic, and a judged exercise is compared byte for byte. The rule is mechanical: **copy the elements into a `std::vector` and sort them before printing**, with whatever order the output calls for:

```cpp
#include <algorithm>
#include <vector>

std::vector<std::pair<std::string, int>> rows(counts.begin(), counts.end());
std::sort(rows.begin(), rows.end(), [](const auto& a, const auto& b) {
    if (a.second != b.second) return a.second > b.second;   // most frequent first
    return a.first < b.first;                               // then alphabetical
});
for (const auto& [word, n] : rows) std::cout << word << ' ' << n << '\n';
```

The same applies to `bucket_count()`, `load_factor()` and hash values: they are real numbers about a real table, and they are not the same on another machine. Print sizes and sorted contents; never print those.

## A struct as a key

Using your own type as a key needs two things the table cannot guess: a hash and an equality. Equality is `operator==`, which C++20 lets you default (Module 11, lesson 2). The hash is a callable that takes a `const Key&` and returns `std::size_t`, passed as the third template argument. Combining the members' hashes is the only design decision — `h1 ^ h2` alone is poor because `{1, 2}` and `{2, 1}` collide, so shift or mix one of them:

```cpp
#include <cstddef>
#include <functional>
#include <unordered_set>

struct Point {
    int x;
    int y;
    bool operator==(const Point&) const = default;   // C++20
};

struct PointHash {
    std::size_t operator()(const Point& p) const noexcept {
        const std::size_t hx = std::hash<int>{}(p.x);
        const std::size_t hy = std::hash<int>{}(p.y);
        return hx ^ (hy + 0x9e3779b9 + (hx << 6) + (hx >> 2));   // boost's hash_combine
    }
};

std::unordered_set<Point, PointHash> visited;
visited.insert({0, 0});
bool again = !visited.insert({0, 0}).second;      // true: already there
```

The alternative is to specialise `std::hash<Point>` in namespace `std` (Module 11, lesson 4), after which `std::unordered_set<Point>` needs no third argument; the functor is simpler and keeps the choice local. The same recipe covers `std::pair`, which — surprisingly — has no standard hash: `std::unordered_map<std::pair<int, int>, int>` does not compile until you supply one, which is why grid problems often encode a cell as `r * cols + c` and hash the `int` instead.

## Ordered or unordered?

| Need | Choose |
| --- | --- |
| Membership, counting, lookup by key; order irrelevant | `std::unordered_map`/`unordered_set` |
| Output in key order; smallest/largest; "first key ≥ k"; ranges | `std::map`/`std::set` |
| A guaranteed worst case, or adversarial keys | `std::map`/`std::set` |
| A key type with `<` but no cheap hash | `std::map`/`std::set` |
| A few dozen elements, looked up rarely | a `std::vector` and `std::find` — no tree, no table |
| Keys are small dense integers | a `std::vector` indexed by the key |

The unordered containers are usually the faster lookup, by a factor that grows with the size; the ordered ones are the faster answer when the question involves order. A sorted `std::vector` with `std::lower_bound` (Module 14, lesson 2) beats both for data that is built once and queried many times, because it has no nodes and no buckets — just contiguous memory.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Printing an unordered container directly | Unspecified order; copy to a vector and sort |
| Comparing output to another machine's bucket count or load factor | Implementation-specific; never print them |
| A custom key with a hash but no `operator==` | Does not compile — the table needs both |
| Holding an iterator across an `insert` | A rehash may have invalidated it; references and pointers survive |
| `std::unordered_map<std::pair<int, int>, V>` | No `std::hash` for `std::pair`; supply a functor or encode the pair |
| `um[key]` to test presence | Inserts, as in `std::map`; use `find`/`count`/`contains` |
| `max_load_factor(0.1)` to "make it faster" | Ten times the buckets, cache misses everywhere; the default is right |

## Key takeaways

- A hash table stores each key in the bucket its hash selects; lookup, insertion and erasure are average O(1) and worst-case O(n) when keys collide.
- The load factor is `size / buckets`; crossing `max_load_factor` (1.0) triggers a rehash that invalidates iterators but not references; `reserve(n)` avoids rehashes.
- Iteration order is unspecified and unstable — copy to a `std::vector` and sort before printing; never print bucket counts or hash values.
- A custom key needs `operator==` and a hash functor (or a `std::hash` specialisation); combine member hashes with a mixing step; `std::pair` has no standard hash.
- Choose unordered for plain lookup, ordered for anything involving order or a guaranteed bound, and a sorted vector for build-once query-many data.
