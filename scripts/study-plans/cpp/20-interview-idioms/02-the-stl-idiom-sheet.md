---
title: The STL idiom sheet — the two-line answers to the common shapes
minutes: 14
---
Interview problems take a small number of shapes — deduplicate, find the first element not below a threshold, count things, keep the k best, sort by several keys — and for each shape the STL has a two-to-six-line answer that an experienced C++ programmer types without thinking. Knowing them is worth more than any single algorithm, because they are the vocabulary the algorithm is written in. This lesson is the sheet: each idiom, the line, the cost, and the trap beside it. Everything here was taught in Modules 13 and 14; what is new is seeing the shapes together and the names to say out loud.

## Sort, unique, erase

```cpp
std::sort(v.begin(), v.end());
v.erase(std::unique(v.begin(), v.end()), v.end());
```

`std::unique` removes *adjacent* duplicates only — hence the sort — and, like every algorithm, it cannot change the container's size: it shifts the survivors to the front and returns an iterator to the new logical end. The `erase` from that iterator to `end()` is the step people forget; without it the vector keeps its old size with unspecified values at the back. O(n log n) for the sort, O(n) for the rest. The alternative when you also need membership queries is `std::set<T> s(v.begin(), v.end());`, which is the same complexity with a larger constant.

## `lower_bound`: the first element not below

```cpp
auto it = std::lower_bound(v.begin(), v.end(), x);   // first element >= x
if (it != v.end()) use(*it, it - v.begin());          // value and index
```

On a sorted range, `lower_bound` is "first ≥ x", `upper_bound` is "first > x", both O(log n), both returning `end()` when nothing qualifies — check before dereferencing. Together they bound the run of elements equal to `x`, so `upper - lower` counts occurrences and `lower != end && *lower == x` is a membership test. On a `std::set` or `std::map` call the *member* `s.lower_bound(x)`: the free algorithm works on any range but walks a tree's iterators linearly.

## Counting with `std::map`

```cpp
std::map<std::string, int> freq;
for (const auto& w : words) ++freq[w];
for (const auto& [word, n] : freq) std::cout << word << ' ' << n << '\n';   // alphabetical
```

`operator[]` inserts a value-initialised entry (zero) when the key is absent and returns a reference, so `++freq[w]` is the whole counter. The map iterates in key order, which is usually the order the answer wants. When order does not matter and n is large, `std::unordered_map` is the same code with average O(1) instead of O(log n) — but its iteration order is unspecified, so copy into a vector and sort before printing.

## A `priority_queue` of pairs

```cpp
std::priority_queue<std::pair<int, std::string>> heap;                  // largest on top
std::priority_queue<int, std::vector<int>, std::greater<>> minHeap;    // smallest on top
```

The default heap is a max-heap; a min-heap names the underlying container and `std::greater<>`. Pairs compare lexicographically — first by `.first`, then `.second` — which is exactly what "by count, ties by name" needs. The bounded-heap idiom keeps the k smallest of n in O(n log k): push every element into a *max*-heap and pop the top whenever the size exceeds k, so the largest are evicted and the k smallest survive (the k largest use a min-heap, symmetrically). Remember the heap's own order is not a sorted order: only `top()` is meaningful, so move the survivors into a vector and sort them to print.

## `minmax`, `gcd`, `lcm`

```cpp
auto [lo, hi] = std::minmax({a, b, c});                    // by value: safe
auto [mn, mx] = std::minmax_element(v.begin(), v.end());   // iterators
std::gcd(12, 18);  std::lcm(4, 6);                         // <numeric>, C++17
```

The initializer-list form of `minmax` returns a `pair<T, T>` by value. The two-argument form returns a pair of *references* to its arguments, which is fine for named variables and undefined behaviour for temporaries: `auto [lo, hi] = std::minmax(f(), g());` binds references to values destroyed at the end of the statement. `std::gcd(0, 0)` is 0, and `lcm` of large values overflows — compute it as `a / gcd(a, b) * b`, dividing first.

## `accumulate` with `0LL`

```cpp
long long total = std::accumulate(v.begin(), v.end(), 0LL);
```

The accumulator's type is the type of the initial value, not the elements'. `std::accumulate(v.begin(), v.end(), 0)` sums into an `int` whatever `v` holds, and overflows at 2.1 × 10⁹; `0LL` makes it 64-bit. The same trap applies to `std::reduce` and to a hand-written `int sum = 0;`.

## Strings: reverse, sort, build

```cpp
std::reverse(s.begin(), s.end());                      // in place
std::string r(s.rbegin(), s.rend());                   // a reversed copy
std::sort(s.begin(), s.end());                         // "cab" -> "abc": the anagram key
std::string(3, '-')  +  std::to_string(n);             // repeat, convert
```

A `std::string` is a random-access range of `char`, so every algorithm applies to it. Sorting the characters gives the canonical key for grouping anagrams; `std::string(n, c)` repeats a character; building output in a `std::string` and printing once beats a stream insertion per token when the output is large.

## `iota`, `bitset` and `bit`

```cpp
std::vector<int> idx(n);
std::iota(idx.begin(), idx.end(), 0);                  // 0, 1, …, n-1: an index permutation
std::sort(idx.begin(), idx.end(), [&](int a, int b) { return v[a] < v[b]; });   // argsort

std::bitset<32> bits(37);                              // 00000000000000000000000000100101
bits.count();  bits.to_string();  bits[0];
std::popcount(37u);  std::bit_width(37u);             // <bit>, C++20: 3 and 6
```

`iota` plus a sort with a lambda is how you sort indexes by their values while leaving the values in place. `std::bitset<N>` is a fixed-width bit array with counting and printing built in; for a runtime width use an `unsigned` and `<bit>`. Note that `popcount` needs an unsigned argument.

## Pairs and tuples for multi-key sorting

```cpp
std::sort(v.begin(), v.end(), [](const Entry& a, const Entry& b) {
    return std::tie(b.score, a.time, a.name) < std::tie(a.score, b.time, b.name);
});   // score descending, then time ascending, then name ascending
```

Tuples compare lexicographically, so a comparison of two `std::tie` tuples is a multi-key comparison with no `if` chain. To reverse one key, swap `a` and `b` in that slot only — the trick above — or negate a numeric key with `std::make_tuple(-a.score, a.time, a.name)`, which is fine while negation cannot overflow. A chain such as `a.score > b.score && a.name < b.name` is *not* a strict weak ordering (two equal scores compare false both ways for any names), and `std::sort` given an inconsistent comparator is undefined behaviour. `std::pair` compares the same way, which is why a `pair<int, string>` heap orders "by count, ties by name" without a comparator.

## The sheet

| Shape | Idiom | Cost |
| --- | --- | --- |
| Deduplicate | `sort` → `erase(unique(…), end)` | O(n log n) |
| First ≥ x / first > x | `lower_bound` / `upper_bound` | O(log n) |
| Count occurrences | `++map[key]` | O(log n) each |
| k smallest of n | max-heap capped at k | O(n log k) |
| Min and max together | `minmax({…})`, `minmax_element` | O(n) |
| Sum safely | `accumulate(…, 0LL)` | O(n) |
| Anagram key | `sort` the string | O(L log L) |
| Sort indexes by value | `iota` + `sort` with a lambda | O(n log n) |
| Multi-key sort | `tie(…) < tie(…)` | O(n log n) |

## Pitfalls

- `unique` without `erase` leaves the vector its old size.
- `lower_bound` on an unsorted range compiles and returns nonsense; on a `set`, use the member.
- `map[k]` in a lookup inserts `k` — a `const` map has no `operator[]` for exactly this reason; `find`, `count` or `contains` (C++20) for reads.
- A `priority_queue` iterates in heap order, not sorted order; `top()` is the only ordered access.
- `minmax(x, y)` with temporaries dangles; `accumulate` with `0` sums in `int`.
- A comparator that is not a strict weak ordering makes `sort` undefined behaviour.

## Key takeaways

- Deduplicate with sort → unique → erase; the erase is the step that shrinks.
- `lower_bound` is "first ≥"; `upper_bound` is "first >"; check for `end()`; use the member on trees.
- `++freq[key]` counts; `map` iterates sorted, `unordered_map` does not.
- k smallest: a max-heap capped at k; pairs and tuples compare lexicographically, so `tie` gives multi-key ordering and pairs order a heap.
- `0LL` in `accumulate`, `minmax({…})` by value, `gcd` before `lcm`.
