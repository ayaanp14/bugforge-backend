---
title: Sorting and searching — comparators, stability and binary search
minutes: 15
---
`std::sort` is the algorithm everyone knows and the one most often called wrong: with a comparator that is not a strict weak ordering, with equal keys whose order the program then silently depends on, or followed by a binary search that uses a different rule from the sort. This lesson settles the comparator contract, sorting records by a key with a tie-break, when `std::stable_sort` is required, the cheaper partial orders `std::partial_sort` and `std::nth_element`, and the four binary-search functions that a sorted range unlocks.

## `std::sort`

```cpp
#include <algorithm>
#include <functional>

std::vector<int> v{5, 3, 8, 1};
std::sort(v.begin(), v.end());                     // 1 3 5 8
std::sort(v.begin(), v.end(), std::greater<>{});   // 8 5 3 1
```

`std::sort` is introsort — quicksort that switches to heapsort when a partition degenerates and to insertion sort on short runs — with a guaranteed O(n log n) worst case since C++11. It needs random-access iterators: `std::vector`, `std::deque`, `std::array`, `std::string` and built-in arrays qualify. A `std::list` does not, and has its own `lst.sort()` member that relinks nodes instead of moving values. The default order is `operator<`; the third argument replaces it. `std::greater<>{}` — the transparent function object from `<functional>` — is the idiom for descending; a lambda does the same at more length.

## The comparator contract

A comparator `comp(a, b)` answers one question: must `a` come strictly before `b`? The standard requires a **strict weak ordering**: `comp(a, a)` is false (irreflexive), `comp(a, b)` and `comp(b, a)` are never both true (asymmetric), the relation is transitive, and "neither before the other" is itself transitive, so it partitions the elements into equivalence classes. `<=` breaks the first rule, and the result is undefined behaviour, not merely a wrong order: introsort trusts the comparator to stop its inner scans, and a comparator that says an element comes before itself lets a scan run past the end of the array and crash. Rules of thumb: write `<` or `>`, never `<=` or `>=`; make the comparator a pure function of its two arguments; and never compare on something that changes while the sort runs.

## Sorting records by a key

```cpp
struct Player { std::string name; int score; };
std::vector<Player> players = readPlayers();
std::sort(players.begin(), players.end(), [](const Player& a, const Player& b) {
    if (a.score != b.score) return a.score > b.score;   // higher score first
    return a.name < b.name;                            // then alphabetical
});
```

Take the elements by `const&` — copying a `std::string` per comparison is the difference between a fast sort and a slow one. The tie-break matters twice over: it makes the order **total**, so the output is the same on every run and with every standard library, and it stops the order of equal scores from being an accident. `std::tie` writes the same comparator in one line — `return std::tie(b.score, a.name) < std::tie(a.score, b.name);` — because tuples compare lexicographically, and for the same reason a `std::vector<std::pair<int, std::string>>` sorts by `first` and then `second` with no comparator at all. A type with a defaulted `operator<=>` (Module 11, lesson 2) sorts by its members in declaration order.

## Stability

`std::sort` makes no promise about the relative order of elements that compare equal: after sorting invoices by customer, one customer's invoices may come out in any order, and that order can change between library versions. When the input order carries meaning — "sort by priority, but within a priority keep arrival order" — use `std::stable_sort`, a merge sort that preserves it. Its cost is a temporary buffer: O(n log n) when the allocation succeeds, O(n log² n) in place when it does not. The alternative is the tie-break above, which turns the question into a total order. One of the two is mandatory whenever equal keys can occur and the output is compared exactly — a judged program that sorts by score alone and then prints names is printing an unspecified order.

## Partial orders: `partial_sort` and `nth_element`

Sorting the whole range to read the top three is wasted work:

```cpp
std::vector<int> v{9, 1, 8, 3, 7, 2};
std::partial_sort(v.begin(), v.begin() + 3, v.end());  // 1 2 3, then the rest in any order
std::nth_element(v.begin(), v.begin() + 2, v.end());   // v[2] == 3; before it <= 3, after it >= 3
```

`std::partial_sort(first, middle, last)` puts the smallest `middle - first` elements, sorted, at the front, in O(n log k). `std::nth_element(first, nth, last)` places at `nth` the element that a full sort would put there and partitions the rest around it — everything before is no greater, everything after no smaller, neither side sorted — in O(n) on average. That is the median in linear time: `nth_element` at `n / 2`, then read `v[n / 2]`; for an even `n` the lower middle is the largest element of the left part, `*std::max_element(v.begin(), v.begin() + n / 2)`, because the partition guarantees it is there. Both rearrange the range; copy first if the original order is still needed.

## Binary search on a sorted range

A sorted range answers "is it there", "where would it go" and "how many" in O(log n):

```cpp
std::vector<int> v{1, 3, 3, 3, 7, 9};
bool has = std::binary_search(v.begin(), v.end(), 3);       // true
auto lo  = std::lower_bound(v.begin(), v.end(), 3);         // first element >= 3: index 1
auto hi  = std::upper_bound(v.begin(), v.end(), 3);         // first element >  3: index 4
auto count = hi - lo;                                       // 3
auto [a, b] = std::equal_range(v.begin(), v.end(), 3);      // the same pair in one call
auto slot = std::lower_bound(v.begin(), v.end(), 5);        // index 4: where 5 belongs
```

`lower_bound` returns the first position whose element is **not less than** the value — the insertion point that keeps the range sorted — and `upper_bound` the first whose element is **greater**. Their difference is the count of a value, and `upper_bound(hi) - lower_bound(lo)` counts everything in the closed interval `[lo, hi]` in two searches. Both return `last` when every element is smaller, so a `lower_bound` result must be tested against `end()` and then against the value before it is called "found"; `std::binary_search` does both tests and returns only a `bool`, which is why it cannot tell you *where*.

Two conditions are non-negotiable. The range must be sorted — or at least partitioned — by the **same** comparator you pass to the search; searching a descending range with the default ascending rule returns nonsense with no diagnostic. And the O(log n) counts comparisons: with random-access iterators the steps are O(log n) too, but on a `std::list` the algorithm still walks O(n) increments. For `std::set` and `std::map` use the member `lower_bound` (Module 13, lesson 4).

## `std::unique` after a sort

```cpp
std::vector<int> v{3, 1, 3, 2, 1};
std::sort(v.begin(), v.end());                       // 1 1 2 3 3
v.erase(std::unique(v.begin(), v.end()), v.end());   // 1 2 3
```

`std::unique` removes only *consecutive* duplicates — on an unsorted range it removes almost nothing — by shifting the survivors to the front and returning the new logical end; the container's size does not change until `erase` cuts the tail. Sort, `unique`, `erase` is the three-line deduplication that Module 20's idiom sheet lists first. `std::is_sorted` checks the precondition when you are not sure the data arrived in order.

## The cost table

| Call | Complexity | Requires |
| --- | --- | --- |
| `std::sort` | O(n log n) | random access, a strict weak ordering |
| `std::stable_sort` | O(n log n) with a buffer, else O(n log² n) | random access |
| `std::partial_sort` (k of n) | O(n log k) | random access |
| `std::nth_element` | O(n) average | random access |
| `std::lower_bound` / `upper_bound` / `binary_search` | O(log n) comparisons | sorted by the same comparator |
| `std::unique` | O(n) | duplicates adjacent (sort first) |

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `return a <= b;` in a comparator | Undefined behaviour — may crash or never finish |
| Sorting by score alone, then printing names | Equal scores come out in an unspecified order |
| `lower_bound` on an unsorted or differently sorted range | Wrong answer, no diagnostic |
| `*std::lower_bound(…)` without testing `end()` | Dereferences past the end |
| `std::unique` without `erase` | The duplicates still count in `size()` |
| A comparator taking `Player` by value | A string copy per comparison |

## Key takeaways

- `std::sort` is O(n log n) introsort on random-access ranges; a `std::list` sorts itself with its member.
- A comparator is a strict weak ordering: `<`, never `<=`; tie-break on a second key so the order is total.
- `std::stable_sort` keeps equal elements in input order; use it, or a tie-break, whenever equal keys can occur.
- `std::partial_sort` for the top k, `std::nth_element` for the k-th element and the median in linear time.
- `lower_bound` is the first element ≥, `upper_bound` the first >, and their difference is a count; the range must be sorted by the same comparator.
- Sort, then `std::unique`, then `erase` — `unique` removes only neighbours.
