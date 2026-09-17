---
title: Transforming and reducing — transform, accumulate and the erase–remove idiom
minutes: 15
---
Most data processing is three verbs: *map* each element to something else, *filter* the ones that matter, *reduce* them to one result. The standard library spells them `std::transform`, `std::copy_if`/`std::remove_if`/`std::partition`, and `std::accumulate`/`std::reduce`, with `std::all_of`/`any_of`/`none_of` and `std::count_if` as the yes/no reductions. This lesson settles how each writes its output — into existing space, through `std::back_inserter`, or by shifting survivors to the front — and the one trap that fails more submissions than any other in this module: `std::accumulate` sums in the type of its *initial value*, so a bare `0` sums in `int` and overflows.

## `std::transform`

```cpp
#include <algorithm>
#include <vector>

std::vector<int> prices{120, 80, 200};
std::vector<int> withTax(prices.size());
std::transform(prices.begin(), prices.end(), withTax.begin(),
               [](int p) { return p + p / 10; });          // 132 88 220

std::transform(prices.begin(), prices.end(), prices.begin(),
               [](int p) { return p * 2; });               // in place: 240 160 400

std::vector<int> qty{2, 1, 4};
std::vector<long long> lineTotal(prices.size());
std::transform(prices.begin(), prices.end(), qty.begin(), lineTotal.begin(),
               [](int p, int q) { return static_cast<long long>(p) * q; });
```

The unary form applies a callable to each element and writes the results through an output iterator; the binary form walks two input ranges in step (the second must be at least as long as the first) and combines the pairs. The output iterator points at space that must already exist — hence `withTax(prices.size())` — or at the input itself for an in-place transform. A `std::string` is a range of `char`, so `std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c) { return static_cast<char>(std::toupper(c)); })` upper-cases in place, with the `unsigned char` parameter that Module 5, lesson 3 requires for `<cctype>`.

## `std::back_inserter`

```cpp
#include <iterator>

std::vector<long long> squares;                    // empty: no size at all
std::transform(v.begin(), v.end(), std::back_inserter(squares),
               [](int x) { return 1LL * x * x; });
```

`std::back_inserter(c)` (in `<iterator>`) returns an output iterator whose every assignment calls `c.push_back` — the destination grows as the algorithm writes. It works with `transform`, `copy`, `copy_if`, `generate_n` and later with ranges. A `reserve` first keeps it from reallocating. Its siblings `std::front_inserter` (for `std::deque` and `std::list`) and `std::inserter(c, pos)` (for `std::set` and `std::map`) do the same through `push_front` and `insert`.

## `std::accumulate` and the `0LL` rule

```cpp
#include <numeric>

std::vector<long long> big{2'000'000'000, 2'000'000'000};
auto wrong = std::accumulate(big.begin(), big.end(), 0);     // sums in int: overflow, UB
auto right = std::accumulate(big.begin(), big.end(), 0LL);   // 4000000000
```

`std::accumulate(first, last, init)` is a left fold: `acc = init; for each x: acc = acc + x; return acc;`. The type of `acc` is the type of `init`, deduced from the argument you pass — not from the elements. `0` is an `int`, so even a `std::vector<long long>` is summed in `int`, and the overflow is undefined behaviour the optimiser is free to exploit. Write `0LL` for integer sums, `0.0` for a `std::vector<double>` (with `0` every partial sum would be truncated to an integer), and `std::string{}` to join strings. The fourth argument replaces `+`:

```cpp
auto product = std::accumulate(v.begin(), v.end(), 1LL, std::multiplies<>{});
auto csv = std::accumulate(words.begin(), words.end(), std::string{},
                           [](std::string acc, const std::string& w) {
                               return acc.empty() ? w : std::move(acc) + "," + w;
                           });
auto longest = std::accumulate(words.begin(), words.end(), std::size_t{0},
                               [](std::size_t best, const std::string& w) { return std::max(best, w.size()); });
```

`std::reduce` (C++17, also in `<numeric>`) is the same fold with one freedom removed and one gained: it may combine the elements in **any order and grouping**, which lets it run in parallel under an execution policy, so the operation must be associative and commutative — fine for `+` on integers, wrong for string concatenation, and for floating point it may change the last digits between runs. For a sequential integer sum `std::accumulate` with `0LL` is the habit; `std::reduce(v.begin(), v.end(), 0LL)` gives the same answer.

## Yes/no reductions

```cpp
bool allPositive = std::all_of(v.begin(), v.end(), [](int x) { return x > 0; });
bool anyZero     = std::any_of(v.begin(), v.end(), [](int x) { return x == 0; });
bool noNegatives = std::none_of(v.begin(), v.end(), [](int x) { return x < 0; });
auto evens       = std::count_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });
```

All three short-circuit like the loops they replace. On an empty range `all_of` and `none_of` are `true` and `any_of` is `false` — vacuous truth, the same answer a `for` loop with a flag would give, and the answer to know for the edge case.

## Selecting: `copy_if`, `remove_if` and erase

```cpp
std::vector<int> v{4, 7, 2, 9, 5};
std::vector<int> big;
std::copy_if(v.begin(), v.end(), std::back_inserter(big), [](int x) { return x > 4; });  // 7 9 5

auto newEnd = std::remove_if(v.begin(), v.end(), [](int x) { return x > 4; });
// v is now 4 2 ? ? ? — size still 5; [newEnd, end) holds unspecified leftovers
v.erase(newEnd, v.end());                                                                // 4 2
```

`copy_if` writes the survivors elsewhere and leaves the source alone. `remove_if` cannot shrink a range — an algorithm sees only iterators — so it shifts the elements that stay to the front, returns the new logical end, and leaves whatever it likes beyond it. The container's `erase(newEnd, end())` finishes the job: the **erase–remove idiom**, two calls that are one operation. Forgetting the erase is the classic bug — `size()` is unchanged and the tail is garbage. C++20 wraps both in one function that also returns how many went: `std::erase_if(v, pred)` (Module 13, lesson 2). `std::remove` does the same for a value.

## `std::partition`

```cpp
std::vector<int> v{4, 7, 2, 9, 5};
auto mid = std::partition(v.begin(), v.end(), [](int x) { return x % 2 == 0; });
// [begin, mid) are the evens, [mid, end) the odds — each group in an unspecified order
std::sort(v.begin(), mid);
std::sort(mid, v.end());
```

`std::partition` moves every element that satisfies the predicate before every element that does not and returns the boundary — an iterator that is itself a range end, which is what the two `sort` calls use. It is O(n) with no allocation but scrambles the order inside each group; `std::stable_partition` keeps the input order within both groups at the cost of a buffer, and `std::partition_point` finds the boundary of an already partitioned range in O(log n). `std::nth_element` and quicksort are this partition applied repeatedly.

## Scans: `partial_sum` and `adjacent_difference`

```cpp
std::vector<long long> v{3, 1, 4, 1, 5};
std::vector<long long> prefix(v.size());
std::partial_sum(v.begin(), v.end(), prefix.begin());                     // 3 4 8 9 14
std::vector<long long> deltas(v.size());
std::adjacent_difference(v.begin(), v.end(), deltas.begin());             // 3 -2 3 -3 4
long long dot = std::inner_product(v.begin(), v.end(), v.begin(), 0LL);   // sum of squares: 52
```

Prefix sums turn every "sum of a sub-range" query into one subtraction: `prefix[j] - prefix[i - 1]`. Note the type: `std::partial_sum` accumulates in the **input's** value type, so a `std::vector<int>` of large values overflows even when the output is a `std::vector<long long>` — convert the input first, or use `std::inclusive_scan(first, last, out, std::plus<>{}, 0LL)`, whose initial value sets the accumulator type the way `accumulate` does. `std::adjacent_difference` copies the first element unchanged and then writes each difference from its predecessor; `std::inner_product` takes its accumulator type from its init, so `0LL` again.

## The shape of a pipeline

```cpp
struct Line { int qty; int price; };
std::vector<Line> stock;                                        // 1. filter
std::copy_if(lines.begin(), lines.end(), std::back_inserter(stock),
             [](const Line& l) { return l.qty > 0; });
std::vector<long long> values;                                  // 2. map
std::transform(stock.begin(), stock.end(), std::back_inserter(values),
               [](const Line& l) { return 1LL * l.qty * l.price; });
long long total = std::accumulate(values.begin(), values.end(), 0LL);   // 3. reduce
```

Filter, map, reduce — three named steps with two intermediate vectors. The intermediates are the price of the classic algorithms' iterator-pair interface, and they are exactly what lesson 5's views remove: `lines | filter | transform` computes the same total lazily, with no copies.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `std::accumulate(…, 0)` over `long long` or `double` data | Sums in `int`: overflow (undefined behaviour) or truncation |
| `std::transform` into an empty vector's `begin()` | Writes past the end — size it or use `std::back_inserter` |
| `std::remove_if` without `erase` | `size()` unchanged; the tail is unspecified |
| `std::reduce` with string concatenation | Elements combined in any order — use `accumulate` |
| Reading order out of `std::partition`'s groups | Unspecified — `stable_partition`, or sort each side |
| `std::partial_sum` over `int` into `long long` | The accumulator is `int`; it overflows anyway |
| `std::copy` whose destination overlaps the source's front | Use `std::copy_backward` |

## Key takeaways

- `std::transform` maps into existing space, in place, or through `std::back_inserter`; the binary form zips two ranges.
- `std::accumulate` folds in the type of its initial value: `0LL`, `0.0`, `std::string{}` — never a bare `0` over wide data.
- `std::reduce` may reorder; use it only for associative, commutative operations.
- `all_of`/`any_of`/`none_of` short-circuit; on an empty range they are true, false and true.
- `remove_if` shifts and returns the new end — always `erase` after it, or call `std::erase_if`.
- `partition` returns the boundary iterator; the groups are unordered unless you use `stable_partition`.
