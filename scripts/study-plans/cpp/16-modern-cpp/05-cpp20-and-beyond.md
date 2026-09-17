---
title: C++20 and beyond — concepts, ranges, format and what is coming
minutes: 16
---
C++20 is the standard this track compiles against, and it is the largest since C++11. Some of its features have already had a lesson of their own — concepts in Module 12, ranges in Module 14, `<=>` in Module 11 — so this lesson does not re-teach them; it puts them side by side as the *shape* of C++20 code, adds the smaller pieces that make daily programs shorter (`std::format`, designated initialisers, `std::jthread`, `[[likely]]`), sketches modules and coroutines in outline, and then looks past the fence at C++23, which does not compile here but which you will meet in code and in interviews. It closes with how to keep up without reading the standard.

## Concepts: constraints you can read

A template used to accept anything and fail deep inside its body; a concept states up front what a type must provide, and a call that does not satisfy it fails at the call site, in one line.

```cpp
#include <concepts>

template <typename T>
concept HasArea = requires(const T& t) {
    { t.area() } -> std::convertible_to<double>;
};

template <HasArea S>                              // the constrained parameter
double doubled(const S& s) { return 2 * s.area(); }

void show(const HasArea auto& s) { std::cout << s.area() << '\n'; }   // constrained auto: the short form

template <std::integral T> T twice(T x) { return x * 2; }   // a standard concept
// twice(2.5);  → error: constraints not satisfied — 'double' does not satisfy 'std::integral'
```

The three spellings — `template <Concept T>`, `requires Concept<T>` after the parameter list, and `Concept auto` in a parameter — are equivalent; use the shortest that fits. `<concepts>` supplies `std::integral`, `std::floating_point`, `std::same_as`, `std::convertible_to`, `std::invocable`, `std::equality_comparable`, `std::totally_ordered` and more. A constrained overload beats an unconstrained one, and a more specific constraint beats a more general one (subsumption), which is how ranges algorithms pick the fast path for random-access iterators.

## Ranges and views: algorithms without begin/end

```cpp
#include <algorithm>
#include <ranges>

std::vector<int> v{5, 3, 9, 1, 4};
std::ranges::sort(v);                                              // no v.begin(), v.end()
auto odd = v | std::views::filter([](int x) { return x % 2; })
             | std::views::transform([](int x) { return x * 10; });
for (int x : odd) std::cout << x << ' ';                           // 10 30 50 90 — computed as you iterate

struct Person { std::string name; int age; };
std::vector<Person> people = /* … */;
std::ranges::sort(people, {}, &Person::age);                       // {} = default <, then a projection
auto youngest = std::ranges::min_element(people, {}, &Person::age);
```

A **range** is anything with `begin()` and `end()`; the `std::ranges::` algorithms take one instead of a pair of iterators and check their arguments with concepts. A **view** is a lazy, non-owning range: `filter`, `transform`, `take`, `drop`, `reverse`, `iota`, `split`, `keys`/`values`, composed with `|`, nothing computed until iterated. A **projection** — the third argument above — tells an algorithm which part of each element to look at, which removes most one-line comparator lambdas. Materialising a view into a container is `std::vector<int> out(odd.begin(), odd.end())` in C++20; `std::ranges::to<std::vector>()` is C++23.

## <=>: one operator, six comparisons

```cpp
#include <compare>

struct Version {
    int major, minor, patch;
    auto operator<=>(const Version&) const = default;   // also generates ==
};
Version{1, 2, 0} < Version{1, 10, 0};                    // true: rewritten as (a <=> b) < 0
std::set<Version> releases;                              // works: std::less uses <
```

Defaulting `operator<=>` compares members in declaration order and gives all six comparisons; its return type — `std::strong_ordering`, `weak_ordering` or `partial_ordering` — states whether equal means substitutable, and `partial_ordering` admits unordered values (`NaN`). Hand-written `<=>` is for types whose ordering is not memberwise (Module 11, lesson 2).

## std::format: the formatting mini-language

```cpp
#include <format>

std::cout << std::format("{:<10}{:>6}{:>9}\n", "NAME", "PORT", "THREADS");
std::cout << std::format("{:<10}{:>6}{:>9}\n", "api", 9000, 8);
std::cout << std::format("{:.2f} | {:04d} | {:x} | {:#b} | {:>8.3f}|\n", 3.14159, 42, 255, 5, 2.5);
//  3.14 | 0042 | ff | 0b101 |    2.500|
std::cout << std::format("{0} then {1} then {0}\n", "a", "b");   // positional arguments
std::string s = std::format("{}", 3.0);                          // "3" — no trailing zeros unless asked
```

A replacement field is `{index:spec}`; the spec is `[fill][align][sign][#][0][width][.precision][type]` — `<`, `>`, `^` align; `0` pads numbers; `.2f` fixes decimals; `d`, `x`, `b`, `o` choose the base; `#` adds the prefix. It is type-safe (a wrong type is a compile error, not a crash), locale-independent, and returns a `std::string`; `std::format_to` writes into an iterator instead. A user type joins in by specialising `std::formatter` (Module 11, lesson 3). `std::format` is the C++20 half of what became `std::print` in C++23.

## The smaller pieces

**Designated initialisers** name the members of an aggregate, in declaration order, and leave the rest at their defaults:

```cpp
struct Server { std::string name; int port = 8080; int threads = 4; bool tls = false; };
Server s{.name = "api", .port = 9000};      // threads 4, tls false
// Server t{.port = 1, .name = "x"};        // error: out of declaration order
```

**`std::jthread`** is `std::thread` that joins in its destructor and carries a `std::stop_token`, so forgetting `join()` is no longer a call to `std::terminate` (Module 17). **`[[likely]]` / `[[unlikely]]`** on a branch hint the optimiser's code layout and change no semantics. **`using enum Color;`** inside a `switch` lets the cases read `case Red:`. **`<bit>`** gives `std::popcount`, `std::bit_width`, `std::has_single_bit`, `std::rotl`; **`<numbers>`** gives `std::numbers::pi`, `e`, `sqrt2` as `constexpr` doubles. **`std::span`** and `<chrono>` calendars were lesson 4; `contains()`, `starts_with`, `std::erase_if`, `std::midpoint`, `std::ssize`, `std::to_array` and `std::source_location` round out the list.

## Modules and coroutines, in outline

A **module** replaces headers: `export module geometry;` in one file, `import geometry;` in another, no macros leaking across the boundary and no re-parsing the same text into every translation unit. `import std;` (C++23) imports the whole standard library in one line. Compilers support modules; build systems and package managers are still catching up, which is why most code you read still uses `#include`, and why a single-file judge cannot demonstrate them.

A **coroutine** is a function that can suspend and resume — it contains `co_await`, `co_yield` or `co_return`. C++20 shipped the *machinery* (promise types, awaiters, `std::coroutine_handle`) but no ready-made generator or task type; `std::generator` arrived in C++23, and asynchronous frameworks bring their own. Know the vocabulary: a coroutine's frame lives on the heap, suspension is cheap, and the mechanism underlies async I/O libraries the way `std::thread` underlies threading.

## C++23: reading only

None of this compiles under `-std=c++20`, and all of it will be in code you read:

| Feature | What it is |
| --- | --- |
| `std::print("{} {}\n", a, b)` / `std::println` | `std::format` straight to stdout; Unicode-aware, faster than `<<` |
| `std::expected<T, E>` | A `T` or an error `E`, without exceptions; `has_value()`, `value()`, `error()`, monadic `and_then`/`or_else` |
| `std::mdspan` | A multidimensional view over contiguous memory — `md(i, j)` over one buffer |
| Deducing `this` | `void f(this Self&& self)` — one function replaces const/non-const overload pairs, and CRTP without the template |
| `std::ranges::to<C>()` | Materialise a view: `v \| views::filter(f) \| ranges::to<std::vector>()` |
| `std::ranges::fold_left`, `views::zip`, `views::enumerate`, `views::chunk` | The ranges pieces C++20 ran out of time for |
| `if consteval`, `static operator()`, `std::flat_map`, `std::generator`, `std::stacktrace`, `std::optional::and_then` | Smaller additions |

C++26 is in progress: static reflection, contracts, `std::execution` (senders and receivers), `std::inplace_vector` and the `_` placeholder for structured bindings are the headlines.

## Keeping up

You do not read the standard. Three sources are enough: cppreference's compiler-support page (a matrix of feature × compiler version — the answer to "can I use this at work?"), cppreference's per-feature pages (which carry the `__cpp_*` macro and the version each feature arrived in), and the feature-test macros from lesson 1, which let the code itself say what it needs. A good habit is to know your project's `-std=` and the oldest compiler it must build with, and to treat "it is in the standard" as necessary but not sufficient.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `template <std::integral T> … twice(2.5)` | Compile error at the call: constraints not satisfied |
| `auto r = v \| std::views::filter(f); v.push_back(1);` then iterating `r` | The view holds an iterator into `v`; reallocation dangles it |
| `std::format("{:d}", 2.5)` | Compile error (a format-spec mismatch is checked at compile time for literal format strings) |
| Designated initialisers out of order or mixed with positional | Compile error |
| Storing a `std::jthread` in a container and expecting output order | Threads interleave; join, then print aggregated results (Module 17) |
| Writing `std::print` or `std::expected` here | Does not exist under `-std=c++20` |
| `std::ranges::sort(v, &Person::age)` | The second argument is the *comparator*; the projection is the third: `sort(v, {}, &Person::age)` |

## Key takeaways

- Concepts constrain templates at the call site; ranges take containers, compose lazy views with `|` and accept projections; `<=>` defaulted gives six comparisons in one line.
- `std::format` is type-safe formatting with `{index:spec}`; it became `std::print` in C++23.
- Designated initialisers name aggregate members in order; `std::jthread` joins itself; `[[likely]]` is a hint, not a rule.
- Modules replace headers and coroutines add suspension, but both need tooling a single-file judge lacks.
- C++23 (`std::print`, `std::expected`, `std::mdspan`, deducing `this`, `ranges::to`) is reading only on this track.
- cppreference's compiler-support matrix plus feature-test macros answer "can I use this?" for any compiler.
