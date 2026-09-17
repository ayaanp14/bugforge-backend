---
title: The vocabulary types — pair, tuple, span, chrono and friends
minutes: 15
---
A vocabulary type is one that appears in function signatures across a whole codebase because everyone agrees what it means: "two things" is a `std::pair`, "maybe a value" is a `std::optional`, "read-only text" is a `std::string_view`, "a length of time" is a `std::chrono::duration`. Using them instead of home-grown equivalents means two libraries can hand values to each other without conversion, and a reader knows the semantics before reading the body. This lesson covers the ones that have not had a module of their own — `std::pair` and `std::tuple` with `std::tie` and `std::apply`, `std::span`, `<chrono>` and `std::byte` — and places `std::optional`, `std::variant` and `std::string_view` beside them by use, so the whole set reads as one toolkit.

## pair and tuple

`std::pair<A, B>` holds two members named `first` and `second`; `std::tuple<Ts...>` holds any number, accessed by index or by type. Both compare lexicographically, which is why a pair sorts by `first` then `second` without a comparator.

```cpp
#include <tuple>
#include <utility>

std::pair<std::string, int> p{"ada", 31};       // or: std::pair p{"ada"s, 31} with CTAD
std::tuple<std::string, int, double> row{"bob", 25, 88.5};

std::cout << p.first << ' ' << std::get<1>(row) << ' ' << std::get<double>(row) << '\n';
auto [name, age, score] = row;                  // structured bindings (lesson 2) — the readable access
```

Two helpers make tuples do work. `std::tie(a, b, c)` builds a tuple of *references* to existing variables, which gives an assignment target and a comparison key in one idiom:

```cpp
int lo, hi;
std::tie(lo, hi) = std::minmax(3, 9);           // assign both results at once (pre-C++17 style)

struct Version { int major, minor, patch; };
bool operator<(const Version& a, const Version& b) {
    return std::tie(a.major, a.minor, a.patch) < std::tie(b.major, b.minor, b.patch);   // lexicographic in one line
}
```

`std::apply(f, t)` calls `f` with the tuple's elements as separate arguments — the bridge from "a tuple of values" to "a function of N parameters":

```cpp
auto print = [](const std::string& n, int a, double s) { std::cout << n << " (" << a << ") " << s << '\n'; };
std::apply(print, row);                         // print("bob", 25, 88.5)
```

When should a function return a tuple? Rarely. `std::pair` is fine for a natural two-ness (`insert`'s iterator-and-bool, a `minmax`), and a tuple is fine at the boundary of generic code, but three values with meaning deserve a struct: `Summary{lo, hi, sum}` bound as `auto [lo, hi, sum]` reads the same as a tuple and `result.sum` reads far better than `std::get<2>(result)`.

## optional, variant and string_view by use

Module 15 taught `std::optional` and `std::variant` in depth and Module 5 taught `std::string_view`; here is the placement rule for each. `std::optional<T>` is "a `T` or nothing" — a lookup that can miss, a parse that can fail, a field that may be unset; test it with `if (opt)` or `has_value()`, read with `*opt` or `value_or(default)`. `std::variant<A, B, C>` is "exactly one of these" — a token that is a number or a word, a message that is one of several commands; take it apart with `std::visit` and an overloaded lambda set. `std::string_view` is "read-only text I do not own" — the parameter type for any function that only reads, at the cost of the lifetime rule: never keep a view past the string it looks into. The three share a design: no heap allocation, value semantics, and a type that states what the value *can* be.

## std::span

`std::span<T>` (C++20) is `std::string_view` for anything contiguous: a pointer and a length, viewing elements owned by someone else. It replaces the `(T* data, std::size_t n)` parameter pair and the "which container?" question at once — a `std::span<const int>` accepts a `std::vector<int>`, a `std::array<int, N>`, a built-in array or a pointer-plus-size, and the function does not care which.

```cpp
#include <span>

long long total(std::span<const int> xs) {          // const: we only read
    long long sum = 0;
    for (int x : xs) sum += x;
    return sum;
}

std::vector<int> v{4, -2, 7, 1, 9};
int raw[] = {1, 2, 3};
total(v);  total(raw);  total({v.data() + 1, 3});    // all fine

std::span<const int> all{v};
auto middle = all.subspan(1, 3);                    // elements 1, 2, 3 — no copy
auto head = all.first(2);  auto tail = all.last(2);
std::cout << middle.size() << ' ' << middle[0] << ' ' << middle.back() << '\n';   // 3 -2 1
```

A span is cheap to copy (two words) and should be passed by value. Its element type says whether the callee may write: `std::span<int>` may modify the caller's elements in place; `std::span<const int>` may not. `subspan`, `first` and `last` are O(1) and produce more spans. Two things a span does *not* do: it does not own (the container must outlive every span into it, and a `push_back` that reallocates leaves the span dangling — Module 13's invalidation rules apply), and it does not bounds-check (`s[i]` past `size()` is UB, exactly like a raw array). A span with a compile-time size, `std::span<int, 4>`, exists for fixed-shape data and is rarely needed.

## chrono: durations and time points

`<chrono>` separates three ideas that untyped `int milliseconds` code muddles: a **duration** is a count of ticks in a unit, a **time point** is a duration since a clock's epoch, and a **clock** says what "now" means. Durations are the part every program uses:

```cpp
#include <chrono>
using namespace std::chrono_literals;

auto d = 90s + 5min + 2h;                          // std::chrono::seconds — the finer unit wins
std::cout << d.count() << '\n';                    // 7590 (ticks in d's unit)
auto m = std::chrono::duration_cast<std::chrono::minutes>(d);   // 126 — truncates toward zero
std::chrono::milliseconds ms = 3s;                 // widening is implicit: 3000
// std::chrono::seconds s = 1500ms;                // error: lossy — spell it with duration_cast

auto hours = std::chrono::duration_cast<std::chrono::hours>(d);
auto rest = d - hours;                             // 390s: durations subtract, compare, divide, take %
std::cout << hours.count() << "h " << (rest / 60).count() << "m " << (rest % 60).count() << "s\n";   // 2h 6m 30s
```

`.count()` is how a duration is printed deterministically — it is the integer you would have kept by hand, now with its unit checked by the type system. (`std::format("{}", d)` prints `7590s` with the unit and `std::chrono::hh_mm_ss{d}` splits it into fields; both exist on libstdc++ 14, and `.count()` is the portable core.) The compile error on the narrowing assignment is the point: a function taking `std::chrono::milliseconds` can be handed `2s` or `500ms` and never a bare `2` that someone meant as seconds.

Time points come from clocks. `std::chrono::steady_clock::now()` is for measuring elapsed time (it never jumps backward); `std::chrono::system_clock::now()` is wall-clock time, convertible to a calendar date. Subtracting two time points gives a duration:

```cpp
const auto start = std::chrono::steady_clock::now();
work();
const auto elapsed = std::chrono::steady_clock::now() - start;
std::cerr << std::chrono::duration_cast<std::chrono::milliseconds>(elapsed).count() << " ms\n";
```

Note `std::cerr`: a judged program must never print a measured time or the current date to standard output, because no expected output can match it (Module 19 covers measurement properly). Durations are pure arithmetic and print the same every run; clocks are not.

## std::byte

`std::byte` (C++17, `<cstddef>`) is a byte that is *not a number*: an `enum class` over `unsigned char` with only the bitwise operators. `std::byte b{0x2A}; b |= std::byte{0x01};` works; `b + 1` and `std::cout << b` do not, and `std::to_integer<int>(b)` is the explicit way out. Use it for buffers of raw memory — file contents, network packets, serialisation — where `char` would invite arithmetic and string operations that have no meaning on the data. When the bytes *are* text, keep `char`.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Returning `std::tuple<int, int, long long>` for min, max, sum | Compiles; every caller must remember which index is which. Return a struct. |
| `std::tie(a, b) = f();` when `f` returns a struct | Compile error; `std::tie` needs a tuple-like. Use `auto [a, b] = f();` |
| Holding a `std::span` across a `push_back` | Dangling after reallocation: UB |
| `std::span<int>` for a read-only parameter | Compiles, but claims write access; write `std::span<const int>` |
| `std::chrono::seconds s = 1500ms;` | Compile error: lossy; `duration_cast` truncates it to `1s` explicitly |
| Printing `steady_clock::now()` or an elapsed time to stdout in a judged program | Different every run; the case can never pass |
| `std::byte b = 5;` | Compile error: no implicit conversion; `std::byte{5}` |

## Key takeaways

- `std::pair`/`std::tuple` hold values positionally and compare lexicographically; `std::tie` makes reference tuples for assignment and comparison keys, `std::apply` unpacks a tuple into a call.
- Three named results are a struct with structured bindings, not a tuple.
- `std::span<const T>` is the parameter type for "any contiguous sequence"; it is a view — cheap to copy, never owning, never bounds-checked.
- `<chrono>` durations carry their unit: widening converts implicitly, narrowing needs `duration_cast`, and `.count()` prints deterministically.
- `steady_clock` measures, `system_clock` tells the date; neither belongs in judged output.
- `std::byte` is raw memory with bitwise operators only; `std::to_integer` converts out.
