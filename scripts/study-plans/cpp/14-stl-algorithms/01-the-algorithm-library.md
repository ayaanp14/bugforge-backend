---
title: The algorithm library — ranges, predicates and the first dozen calls
minutes: 14
---
Every loop in Module 3's pattern catalogue — the search, the count, the minimum and maximum, the reversal — already exists in `<algorithm>` and `<numeric>` as a named function that takes a pair of iterators and, often, a callable. This lesson settles the interface those functions share — the half-open range, the predicate, the iterator that comes back — and works through the first dozen you will reach for daily: `find`, `find_if`, `count`, `count_if`, `min`/`max` and their `_element` cousins, `fill`, `iota`, `generate`, `reverse` and `copy`. The rest of the module builds on exactly this shape, and the last lesson shows how C++20 ranges shorten it.

## Two headers, one convention

`<algorithm>` holds the functions that walk, search, rearrange and copy; `<numeric>` holds the arithmetic ones — `std::iota`, `std::accumulate`, `std::partial_sum`, `std::gcd`. Forgetting the second header is the commonest "`iota` is not a member of `std`" error. Every algorithm takes its input as a **half-open range** `[first, last)`: an iterator to the first element and one past the last. `last` is never dereferenced; it is a fence. That is why `v.end()` is a valid `last`, why an empty range is `first == last`, and why a sub-range is spelt with arithmetic on the iterators:

```cpp
#include <algorithm>
#include <iterator>
#include <vector>

std::vector<int> v{5, 3, 8, 1, 9, 2};
std::sort(v.begin(), v.end());                 // the whole container
std::sort(v.begin() + 1, v.end() - 1);         // elements 1..4 only
int arr[] = {4, 2, 7};
std::reverse(std::begin(arr), std::end(arr));  // a built-in array, via <iterator>
```

Algorithms know nothing about containers — only iterators (Module 13, lesson 6) — which is why the same `std::find` searches a `std::vector`, a `std::deque`, a `std::string`, a built-in array or a `std::list`. The iterator category decides what is allowed: `std::sort` demands random access, `std::find` accepts anything that can be incremented, dereferenced and compared.

## Predicates and callables

Half the algorithms take a **callable** — anything that can be called with an element: a function, a function object (Module 11, lesson 4) or, almost always, a lambda (Module 4, lesson 5). A **unary predicate** takes one element and returns something convertible to `bool`; a **binary predicate** takes two. The algorithm calls it; you never do:

```cpp
bool isNegative(int x) { return x < 0; }

std::vector<int> v{3, -1, 4, -1, 5};
auto a = std::find_if(v.begin(), v.end(), isNegative);                   // a function
auto b = std::find_if(v.begin(), v.end(), [](int x) { return x > 3; });  // a lambda
```

A predicate must not modify the elements it is given, and it should be a pure function of its argument: the algorithm may copy it, and the standard does not promise how many times or in what order it is called.

## Finding things

```cpp
std::vector<int> v{3, -1, 4, -1, 5};
auto it = std::find(v.begin(), v.end(), 4);            // first element == 4
if (it != v.end()) {
    std::cout << "found at index " << (it - v.begin()) << '\n';
}
```

`std::find` returns an **iterator** to the first match, or `last` when there is none — never `-1`, never a null pointer, never an exception. The `!= end()` test is the idiom; dereferencing the result without it is undefined behaviour. The index is `it - v.begin()` for random-access iterators and `std::distance(v.begin(), it)` for any category. `std::find_if` takes a predicate instead of a value and is the one you want for records:

```cpp
struct Account { std::string owner; int balance; };
std::vector<Account> accounts = loadAccounts();
auto overdrawn = std::find_if(accounts.begin(), accounts.end(),
                              [](const Account& a) { return a.balance < 0; });
if (overdrawn != accounts.end()) std::cout << overdrawn->owner << '\n';
```

`std::find_if_not` inverts the test. For "is this value present" `std::find(...) != end()` reads fine on a sequence, but for a `std::set` or `std::map` use the member `find` or `contains` — the free algorithm walks every node in O(n) where the member takes O(log n). `std::search` finds a sub-sequence, `std::adjacent_find` the first pair of equal neighbours, `std::mismatch` the point where two ranges first differ, and `std::equal` whether they differ at all.

## Counting

```cpp
std::string s = "mississippi";
auto n  = std::count(s.begin(), s.end(), 's');                                      // 4
auto is = std::count_if(s.begin(), s.end(), [](char c) { return c == 'i'; });      // 4
```

Both return the iterator's `difference_type` — a signed integer, `std::ptrdiff_t` for every standard container — so `auto` or `long long` is the right variable: assigning to `int` narrows silently on a huge range, and `std::size_t` invites the signed/unsigned comparison warning. `std::count_if` over records with a lambda replaces the "loop, test, increment" pattern of Module 3, lesson 5.

## Min, max and their positions

`std::min(a, b)` and `std::max(a, b)` compare two values of the **same** type — `std::max(3, 4.5)` fails to compile because `T` deduces to both `int` and `double`; write `std::max<double>(3, 4.5)` or `std::max(3.0, 4.5)`. The initialiser-list forms `std::min({a, b, c})` and `std::max({a, b, c})` take several values, `std::minmax(a, b)` returns a pair, and `std::clamp(x, lo, hi)` (C++17) pins a value into an interval. The two-argument forms and `clamp` return a reference to one of their arguments, so `const int& r = std::max(x, 5);` dangles when the temporary `5` wins — take the result by value.

Over a range, the `_element` versions return iterators:

```cpp
std::vector<int> temps{21, 19, 25, 19, 25};
auto hottest = std::max_element(temps.begin(), temps.end());      // first 25: index 2
auto coldest = std::min_element(temps.begin(), temps.end());      // first 19: index 1
auto [lo, hi] = std::minmax_element(temps.begin(), temps.end());  // first 19 (1), LAST 25 (4)
std::cout << *hottest << " at " << (hottest - temps.begin()) << '\n';
```

The asymmetry is deliberate and worth memorising: `max_element` returns the *first* of several equal maxima and `min_element` the first minimum, but `minmax_element` returns the first minimum and the **last** maximum — its pairwise scheme, about three comparisons per two elements, settles ties at opposite ends. On an empty range all three return `last`; test before dereferencing. A comparator as the third argument chooses the key: `std::max_element(accounts.begin(), accounts.end(), [](const Account& a, const Account& b) { return a.balance < b.balance; })` finds the richest account — the comparator is always "less than", even when you want the largest.

## Filling, generating, reversing, copying

```cpp
#include <numeric>

std::vector<int> v(5);
std::fill(v.begin(), v.end(), -1);                                        // -1 -1 -1 -1 -1
std::iota(v.begin(), v.end(), 10);                                        // 10 11 12 13 14
std::reverse(v.begin(), v.end());                                         // 14 13 12 11 10
std::generate(v.begin(), v.end(), [n = 0]() mutable { return n += 3; });  // 3 6 9 12 15
std::vector<int> w(v.size());
std::copy(v.begin(), v.end(), w.begin());                                 // w must already have room
```

`std::iota` writes `value, value + 1, value + 2, …` — the index vector `0..n-1` that a sort-by-key needs, or the "1 to n" a loop would build. `std::generate` calls a callable once per slot; a stateful lambda with a `mutable` init-capture (lesson 4) is the usual source. `std::copy` writes through an iterator into space that **must exist**: copying into an empty vector's `begin()` is undefined behaviour. Lesson 3 introduces `std::back_inserter`, the output iterator that grows the destination instead. `std::swap_ranges`, `std::rotate` and `std::shuffle` (which needs a seeded engine, and whose result is not something a judged program should print) round out the rearrangers.

## Why algorithms beat hand loops

Three reasons, and an interviewer expects all three. **Names**: `std::count_if(…, isOverdue)` states the loop's purpose where `for (…) if (…) ++n;` makes the reader reconstruct it. **Correctness**: the empty range, the single element, the first-versus-last tie and the boundary are already handled — every bug in Module 3's "what goes wrong" tables lives in a loop someone wrote instead of calling. **Optimisation**: the library specialises where it can — `std::copy` and `std::fill` over trivially copyable elements become `memmove` and `memset`, `std::sort` is introsort with an insertion-sort tail, and the compiler inlines a lambda into the algorithm as if it were the loop body. A hand loop can match that; it rarely does. "No raw loops" is a goal rather than a law, but a loop that an algorithm could replace is a loop you should be able to justify.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `*std::find(…)` without the `!= end()` test | Dereferences `end()`: undefined behaviour |
| `std::max(3, 4.5)` | Compile error: `T` cannot be both `int` and `double` |
| `int n = std::count(…)` | Silent narrowing from `ptrdiff_t`; hold it in `auto` |
| `std::find` on a `std::map` | O(n) walk; the member `find` is O(log n) |
| `std::copy` into an empty destination | Writes past the end; size it first or use `std::back_inserter` |
| `std::sort(lst.begin(), lst.end())` on a `std::list` | Compile error: not random access; call `lst.sort()` |
| A range built from two containers (`a.begin(), b.end()`) | Undefined behaviour — the iterators never meet |
| Forgetting `<numeric>` | `std::iota` and `std::accumulate` "not a member of `std`" |

## Key takeaways

- Every algorithm takes `[first, last)`; `last` is a fence that is never dereferenced, and an empty range is `first == last`.
- `find`/`find_if` return an iterator or `last`; test `!= end()` before using it; the index is `it - begin()`.
- `count`/`count_if` return a signed `difference_type` — hold it in `auto` or `long long`.
- `std::min`/`max` need one type; `max_element`/`min_element` return the first extreme, `minmax_element` the first minimum and the last maximum.
- `fill`, `iota`, `generate` write into existing space; `copy` needs a destination that already has room.
- Algorithms win on intent, edge cases and library optimisation — reach for one before writing a loop.
