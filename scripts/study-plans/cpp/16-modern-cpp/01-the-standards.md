---
title: The standards — what each C++ added, and what runs here
minutes: 12
---
"C++" names a family of standards, not one language. The C++ of a 2003 textbook has no `auto`, no lambdas, no smart pointers in the library and no move semantics; the C++ this track teaches has all of those and treats them as the default. A version number is therefore the first thing to establish about any C++ code: what it may use, what its compiler must support, and which idioms it should be judged by. This lesson lays out the timeline, what each standard contributed, how a program can ask its own compiler what it supports, exactly what compiles on this track's runtime, and what "modern C++" means when people use it as a compliment.

## One language, six editions

C++ was standardised by ISO in 1998, patched in 2003, and then stalled for eight years. C++11 was the reset — Bjarne Stroustrup called it "a new language" — and since then the committee has shipped on a three-year clock: C++14, C++17, C++20, C++23, with C++26 in progress. The releases alternate in size: 11 and 20 each rewrote how idiomatic code looks, while 14, 17 and 23 mostly filled in what the previous release had left rough.

| Standard | Year | Character |
| --- | --- | --- |
| C++98 / C++03 | 1998 / 2003 | Templates, exceptions, the STL, namespaces — the "classic" language |
| C++11 | 2011 | The reset: `auto`, lambdas, move semantics, smart pointers, threads |
| C++14 | 2014 | Generalisations and fixes of C++11 |
| C++17 | 2017 | Vocabulary types, structured bindings, `if constexpr`, filesystem |
| C++20 | 2020 | Concepts, ranges, modules, coroutines, `std::format`, `<=>` |
| C++23 | 2023 | `std::print`, `std::expected`, `std::mdspan`, deducing `this` |

A compiler is not "a version"; it is told one with `-std=c++20`, and GCC, Clang and MSVC each implement the newer standards at their own pace. "Does this compile?" is therefore a question about a compiler-and-flag pair, never about the language alone.

## C++11: the language you actually write

Almost everything this track has called idiomatic arrived in 2011. If a codebase is stuck before it, the code looks like C with classes.

| Area | C++11 additions |
| --- | --- |
| Declarations | `auto`, `decltype`, `nullptr`, `enum class`, `static_assert`, `constexpr`, `long long` |
| Functions | Lambdas, rvalue references and move semantics, `= default` / `= delete`, `override` / `final`, `noexcept`, delegating constructors |
| Loops and init | Range-based `for`, uniform brace initialisation, `std::initializer_list` |
| Templates | Variadic templates, alias templates (`using`) |
| Library | `std::unique_ptr` / `shared_ptr` / `weak_ptr`, `std::array`, `std::tuple`, `std::function`, `std::unordered_map`, `<chrono>`, `<random>`, `<regex>`, `std::thread` / `mutex` / `atomic`, `std::to_string` |

The three that changed the most code: `auto` (declarations stopped repeating types), lambdas (algorithms became usable in place), and move semantics (returning a `std::vector` by value became free, so functions started returning values instead of filling output parameters).

## C++14 and C++17: filling in

C++14 relaxed what C++11 had allowed only narrowly: `constexpr` functions may contain loops and locals, lambdas may take `auto` parameters (generic lambdas) and capture by initialiser (`[p = std::move(p)]`), ordinary functions may deduce their return type, and `std::make_unique` — forgotten from C++11 — was added. Binary literals (`0b1010`) and digit separators (`1'000'000`) date from here.

C++17 is the release whose features you meet in every lesson of this module: structured bindings, `if` and `switch` with an initialiser, `if constexpr`, class template argument deduction (`std::pair p{1, 2.0}`), fold expressions, `inline` variables, guaranteed copy elision, nested namespace declarations, and the attributes `[[nodiscard]]`, `[[maybe_unused]]` and `[[fallthrough]]`. The library gained its vocabulary types — `std::optional`, `std::variant`, `std::any`, `std::string_view`, `std::byte` — plus `std::filesystem`, `std::from_chars`, `std::apply`, `std::clamp`, `std::gcd`, `std::size` and the parallel algorithm overloads.

## C++20: the second big one

C++20 brought four "big" features and a long tail of small ones. Concepts constrain templates and turn a page of template errors into one sentence. Ranges give algorithms a container-level interface and lazy `views`. Coroutines and modules are language-level infrastructure that library and build-system support is still catching up with (lesson 5). The tail is where daily code changed: the three-way comparison `<=>`, `std::format`, `std::span`, `std::jthread`, designated initialisers, `consteval` and `constinit`, `constexpr` `std::vector` and `std::string`, `[[likely]]`, `using enum`, `<bit>`, `<numbers>`, `std::source_location`, `contains()` on the associative containers, `starts_with` / `ends_with`, `std::erase_if`, `std::midpoint`, and calendars and time zones in `<chrono>`.

## C++23: reading only on this track

C++23 added `std::print` and `std::println` (formatted output without `<<`), `std::expected` (a value or an error, without exceptions), `std::mdspan` (a multidimensional view over contiguous memory), *deducing `this`* (explicit object parameters, which make const/non-const overload pairs far shorter), `std::ranges::to` (materialise a view into a container), `std::ranges::fold_left`, `if consteval`, `std::flat_map`, `std::generator`, `std::stacktrace`, monadic `std::optional` and `import std;`. libstdc++ 14 has `std::expected` under `-std=c++23`, but this track compiles with `-std=c++20`, where none of it exists. Everything C++23 in this module is taught for reading and the quiz; no exercise depends on it.

## Feature-test macros

A program can ask the compiler what it supports. `__cplusplus` expands to the standard's date: `199711L` for C++98/03, `201103L`, `201402L`, `201703L`, `202002L`, `202302L`. Beyond that, every feature has a macro: language features are predefined (`__cpp_concepts`, `__cpp_constexpr`, `__cpp_structured_bindings`), and library features (`__cpp_lib_format`, `__cpp_lib_ranges`, `__cpp_lib_print`) are defined by `<version>`, a C++20 header that exists only to publish them.

```cpp
#include <iostream>
#include <version>

int main() {
    std::cout << __cplusplus << '\n';          // 202002 on this track
#ifdef __cpp_lib_format
    std::cout << "format " << __cpp_lib_format << '\n';   // 202110
#endif
#ifndef __cpp_lib_print
    std::cout << "no std::print here\n";       // C++23: absent under -std=c++20
#endif
    return 0;
}
```

Measured on this track's judge, the program prints `202002`, `format 202110` and `no std::print here`. The value is a date, so `#if __cpp_lib_format >= 202106L` asks for "at least the revision that added X" rather than "is it there at all". Two cautions: MSVC reports `__cplusplus` as `199711L` unless given `/Zc:__cplusplus`, so test `_MSVC_LANG` there; and a macro proves the compiler *claims* the feature, which is not the same as the feature being complete.

## What compiles on this track

The study judge is Clang 18 with libstdc++ 14 and `-std=c++20 -O2`. Everything in the C++11 through C++20 rows above compiles and runs — including concepts, ranges and views, `std::format`, `std::span`, `<=>`, `std::jthread`, designated initialisers, `consteval` and `constinit`, `constexpr` containers inside a function, `<bit>` and `<numbers>`. Modules and coroutines compile in principle but need build-system or library scaffolding a single-file judge does not have, so they stay in prose. Nothing from the C++23 row compiles.

## "Modern C++" is a style, not a version

Ask what "modern C++" means and the answer is a set of habits rather than a flag. Compare two programs that do the same thing:

```cpp
// The 2003 shape
int* data = new int[n];
for (int i = 0; i < n; i++) std::cin >> data[i];
std::sort(data, data + n);
long long sum = 0;
for (int i = 0; i < n; i++) sum += data[i];
delete[] data;
```

```cpp
// The modern shape
std::vector<int> data(n);
for (auto& x : data) std::cin >> x;
std::ranges::sort(data);
const long long sum = std::accumulate(data.begin(), data.end(), 0LL);
```

The second is shorter, but that is not the point. It cannot leak (the container owns its memory — Module 7), cannot walk off the end of the buffer (range-`for` — Module 3), cannot be sorted with the wrong length, and states its intent — sort, accumulate — instead of spelling out the loops. The habits, in the order the track taught them: RAII and no raw `new`; value semantics and return by value; `const` and `constexpr` by default; `auto` where the type is obvious or unnameable; algorithms and ranges over hand-written loops; `std::string_view` and `std::span` for read-only parameters; `enum class`; `nullptr`; brace initialisation; and explicit `std::`. A C++20 compiler running C++03 habits is not modern; a C++17 compiler running these habits is.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Writing C++23 (`std::print`, `std::expected`) for this judge | Compile error: the headers or names do not exist under `-std=c++20` |
| Trusting `__cplusplus` on MSVC | `199711L` regardless of the real mode unless `/Zc:__cplusplus` is set |
| `#ifdef __cpp_lib_format` without `<version>` (or `<format>`) | The macro is never defined, so the fallback path always compiles |
| Reading "C++11 is old" as "C++11 features are legacy" | `auto`, lambdas and smart pointers are the core of every later standard |
| Forgetting `-std=` on the command line | GCC 14 defaults to C++17; C++20 features fail to compile with confusing errors |

## Key takeaways

- C++ ships every three years: 11 and 20 were the large releases, 14, 17 and 23 the refinements.
- C++11 brought `auto`, lambdas, moves, smart pointers and threads; C++17 the vocabulary types and structured bindings; C++20 concepts, ranges, `std::format`, `std::span` and `<=>`.
- `__cplusplus` and the `__cpp_*` macros from `<version>` let a program test its own compiler; the values are dates.
- This track compiles with Clang 18, libstdc++ 14, `-std=c++20`: everything through C++20 runs, and C++23 is reading only.
- Modern C++ is a style — RAII, value semantics, `const`, `auto`, algorithms, no raw `new` — not a compiler flag.
