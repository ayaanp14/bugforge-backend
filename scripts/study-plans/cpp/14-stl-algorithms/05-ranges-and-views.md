---
title: Ranges and views — C++20 pipelines
minutes: 15
---
Every algorithm so far took two iterators, and every pipeline needed an intermediate vector per step. C++20's `<ranges>` fixes both. The constrained algorithms in `std::ranges::` take the container itself and a **projection** that says which part of each element to look at; the **views** in `std::views::` are lazy, non-owning adaptors that compose with `|` into a pipeline that computes nothing until it is walked. This lesson settles what each brings, how a pipeline is materialised into a vector on a C++20 runtime, and the handful of rules — caching, `const`, re-evaluation, lifetime — that keep views honest.

## Constrained algorithms and projections

```cpp
#include <algorithm>
#include <ranges>

std::vector<int> v{5, 3, 8, 1};
std::ranges::sort(v);                                              // whole container, no begin/end
auto it = std::ranges::find(v, 8);                                 // an iterator, or v.end()
auto n  = std::ranges::count_if(v, [](int x) { return x > 2; });
```

`std::ranges::sort(v)` is `std::sort(v.begin(), v.end())` with the iterators taken for you and, crucially, with **concepts** (Module 12, lesson 5) on the parameters: passing a `std::list` fails with a constraint error that names `random_access_iterator`, not with forty lines of template noise. The iterator-pair forms still exist, and the end may be a *sentinel* of a different type from the iterator. Return values changed in a few places — `std::ranges::minmax(v)` returns a struct with `.min` and `.max` *values*, `std::ranges::minmax_element` the same with iterators, and `std::ranges::sort` returns the end of the range.

The extra parameter is the **projection**: a callable applied to each element before the comparator or predicate sees it.

```cpp
struct Person { std::string name; int age; };
std::vector<Person> people = readPeople();
std::ranges::sort(people, {}, &Person::age);                                     // by age, default less
std::ranges::sort(people, std::ranges::greater{}, &Person::age);                 // oldest first
auto adults = std::ranges::count_if(people, [](int a) { return a >= 18; }, &Person::age);
auto ann    = std::ranges::find(people, std::string{"ann"}, &Person::name);
std::ranges::sort(people, {}, [](const Person& p) { return std::tie(p.age, p.name); });   // age, then name
```

`{}` is the default comparator `std::ranges::less`; a pointer-to-member is the commonest projection, and a lambda returning a `std::tie` is how to sort by a key with a tie-break. The comparator sees `int`s, the predicate sees `int`s, `find` compares a `std::string` — each part of the call does one job, where the classic lambda comparator did three.

## Views

```cpp
std::vector<int> v{1, 2, 3, 4, 5, 6, 7, 8};
auto evens    = v | std::views::filter([](int x) { return x % 2 == 0; });      // 2 4 6 8
auto squares  = evens | std::views::transform([](int x) { return x * x; });     // 4 16 36 64
auto firstTwo = squares | std::views::take(2);                                  // 4 16
for (int x : firstTwo) std::cout << x << ' ';
```

A **view** is a lightweight object that refers to a range and presents it differently. Nothing is computed when the view is created: `filter` runs its predicate and `transform` its function only when an element is *asked for*, by the `for` loop or an algorithm — **laziness**. A view is non-owning (it holds the vector by reference, so the vector must outlive it), cheap to copy, and composed with `|`: the pipeline `v | filter | transform | take` reads left to right, with no intermediate containers, and stops after two elements because `take` never asks for a third.

| Adaptor | Yields |
| --- | --- |
| `views::filter(pred)` | the elements for which `pred` is true |
| `views::transform(f)` | `f(element)` for each element |
| `views::take(n)` / `views::drop(n)` | the first `n` / everything after the first `n` |
| `views::take_while(pred)` / `views::drop_while(pred)` | a prefix / the rest, decided by `pred` |
| `views::reverse` | the range backwards (bidirectional or better) |
| `views::iota(a, b)` / `views::iota(a)` | the integers in `[a, b)` / from `a` without end |
| `views::keys` / `views::values` | the `.first` / `.second` of each pair — a map's keys |

```cpp
for (int i : std::views::iota(1, 6)) std::cout << i;                             // 12345
auto odds = std::views::iota(1) | std::views::filter([](int x) { return x % 2; })
                                | std::views::take(3);                            // 1 3 5, from an infinite range
for (const auto& k : ages | std::views::keys) std::cout << k << ' ';              // a map's keys, in order
for (int x : v | std::views::reverse | std::views::drop(1)) std::cout << x;       // 7654321
```

`views::iota(1)` with no upper bound is infinite, and the pipeline still terminates because `take(3)` stops pulling — the clearest demonstration that a view is a *recipe*, not a result. `std::ranges::for_each`, `count_if`, `find`, `max_element` and the rest accept a view wherever they accept a container.

## Materialising a view

A view is not a vector: it has no `size()` unless every adaptor preserves one (`filter` does not), cannot be indexed unless random access survives, and cannot be returned from a function that lets the source die. To keep the results, copy them out:

```cpp
#include <iterator>

std::vector<long long> out;
std::ranges::copy(v | std::views::filter(positive) | std::views::transform(square) | std::views::take(k),
                  std::back_inserter(out));
```

`std::ranges::copy` into a `std::back_inserter` is the C++20 answer. The iterator-pair constructor `std::vector<int>(r.begin(), r.end())` does **not** compile for a pipeline like this: `filter` and `take` produce an `end()` that is a sentinel of a different type from `begin()`, and the constructor wants two of the same. `r | std::views::common` bridges the two when an old interface insists on an iterator pair. C++23 adds `std::ranges::to<std::vector>()` at the end of a pipeline, plus `std::views::enumerate`, `zip`, `chunk` and `adjacent` — worth recognising in modern code and in interviews, but this track's runtime is C++20 and none of them compile here: `ranges::copy` and `back_inserter` are the tools.

## What to keep in mind

**`filter` caches `begin()`.** Finding the first passing element costs a scan, so `filter_view` remembers where it is. Two consequences: the view's `begin()` is not `const`, so a `const auto evens = v | std::views::filter(…)` cannot be iterated (compile error), and changing the underlying vector after the first pass leaves the cache stale. Build the view, walk it, and do not mutate the source in between.

**`transform` recomputes.** The function runs every time an element is read — walk a `transform` view twice and pay twice; index it in a loop and pay per access. Materialise when the function is expensive or the result is read more than once.

**Views dangle like references.** A view built from an lvalue holds a reference to it: return `v | std::views::filter(…)` from the function that owns `v`, or keep the view in a member after the vector is gone, and the view refers to a dead object — a bug of exactly Module 6's kind. (A pipeline started from an rvalue container, `getVector() | std::views::filter(…)`, moves the container into an `owning_view` and is safe.) When you must return the data, return a vector.

**Adaptors lose capabilities.** `filter` drops random access and `size()`; `reverse` needs a bidirectional source; `transform` keeps the category but, when its function returns by value, yields temporaries you cannot assign through. When an algorithm refuses a view, the concept named in the error is the missing capability.

## What ranges fix

The classic `std::sort(v.begin(), v.end(), [](const Person& a, const Person& b) { return a.age < b.age; })` becomes `std::ranges::sort(people, {}, &Person::age)`; the filter–map–reduce pipeline of lesson 3, with its two intermediate vectors, becomes one expression with none; "the first k elements that match" stops being a loop with a counter; and an infinite sequence — every odd number, every power of two — is expressible at all, because `take` and `take_while` decide when to stop. What stays the same is the algorithm underneath: `std::ranges::sort` is introsort, `std::ranges::find` is a linear scan, and every complexity in lesson 2's table holds. Ranges change how a call is *written*, not what it costs.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Iterating a `const` `filter_view` | Compile error — `begin()` is non-`const` because it caches |
| `std::vector<int>(r.begin(), r.end())` on a filtered pipeline | Compile error — iterator and sentinel differ; use `ranges::copy` or `views::common` |
| Ending a pipeline in `std::ranges::to<std::vector>()` | C++23; does not compile on this runtime |
| A view of a local that goes out of scope | Dangling — an lvalue source must outlive the view |
| Walking an expensive `transform` twice | The function runs twice per element |
| Mutating the source after a `filter`'s first pass | Stale cached `begin()` |
| Passing a `std::list` to `std::ranges::sort` | Constraint failure: not `random_access_iterator` |

## Key takeaways

- `std::ranges::` algorithms take the container, check it with concepts, and accept a projection: `sort(v, {}, &T::member)`.
- Views are lazy, non-owning recipes composed with `|`; `filter`, `transform`, `take`, `drop`, `reverse` and `iota` cover most pipelines.
- Nothing runs until the view is walked, so `take` on an infinite `iota` terminates.
- Materialise with `std::ranges::copy(view, std::back_inserter(out))` — `ranges::to` is C++23 and unavailable here.
- `filter` caches and is not `const`-iterable; `transform` recomputes on every read; a view must not outlive its source.
- Ranges change the spelling, not the cost: the same algorithms and complexities sit underneath.
