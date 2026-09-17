---
title: Type traits and metaprogramming — computing with types
minutes: 15
---
A type trait is a class template that answers a question about a type at compile time — is it an integer, is it a pointer, what is it once the `const` and the `&` are stripped — or that manufactures a new type from an old one. `<type_traits>` holds a hundred of them, every one built from the specialisation machinery of lesson 3, and they are what makes `if constexpr` dispatch, forwarding references and generic containers work. This lesson covers the traits you will actually use, `decltype` and `std::declval` for naming the type of an expression, `if constexpr` as the dispatch tool, SFINAE and `std::enable_if` as the pre-C++20 technique you must be able to read, and why a `constexpr` function beats template recursion for computing values.

## The predicates

```cpp
#include <stdexcept>
#include <string>
#include <type_traits>

static_assert(std::is_integral_v<int>);
static_assert(std::is_integral_v<bool>);            // bool is an integer type to the language
static_assert(std::is_floating_point_v<double>);
static_assert(std::is_same_v<int, signed int>);
static_assert(!std::is_same_v<int, long>);          // different types even where both are 32 bits
static_assert(std::is_pointer_v<const char*>);
static_assert(std::is_class_v<std::string>);
static_assert(std::is_base_of_v<std::exception, std::runtime_error>);
static_assert(std::is_convertible_v<int, double>);
```

Each `std::is_x<T>` is a struct with a `static constexpr bool value`, and `std::is_x_v<T>` is the C++17 variable template that saves writing `::value`. The implementation is lesson 3's trait pattern: a primary template deriving from `std::false_type`, specialisations for the matching types deriving from `std::true_type`, and a partial specialisation `is_pointer<T*>` for the pointer family. Two more you will meet: `std::is_arithmetic_v` (integral or floating), and `std::is_nothrow_move_constructible_v`, which `std::vector` consults before deciding whether to move or copy elements when it grows (Module 9).

## The transformers

Traits that produce a type expose it as `::type`, with a `_t` alias:

| Trait | `int` becomes | Used for |
| --- | --- | --- |
| `std::remove_cvref_t<const int&>` | `int` | Naming the plain type behind a forwarding reference |
| `std::remove_pointer_t<int*>` | `int` | Pointee of a pointer parameter |
| `std::add_pointer_t<int>` | `int*` | Building a pointer type |
| `std::make_unsigned_t<int>` | `unsigned int` | Bit manipulation on a signed input |
| `std::decay_t<const char(&)[6]>` | `const char*` | What a by-value parameter would receive |
| `std::conditional_t<B, T, F>` | `T` if `B` else `F` | Choosing a type by a compile-time flag |
| `std::common_type_t<int, double>` | `double` | The type `?:` would produce |
| `std::underlying_type_t<E>` | the enum's integer type | Printing an `enum class` |

`std::conditional_t` is a type-level `?:` and the everyday way to pick a representation:

```cpp
template <typename T>
using Accumulator = std::conditional_t<std::is_integral_v<T>, long long, double>;

template <typename T>
Accumulator<T> total(const std::vector<T>& v) {
    Accumulator<T> sum{};
    for (const T& x : v) sum += x;
    return sum;
}
```

`total` on a `std::vector<int>` sums into a `long long` and cannot overflow on a few thousand values; on a `std::vector<float>` it sums into a `double`. Both branch types must be valid — `conditional_t` selects, it does not discard — so it cannot choose between "a type that exists" and "one that does not".

`remove_cvref_t` earns its place with forwarding references. `template <typename T> void f(T&& x)` deduces `T` as `std::string&` for an lvalue `std::string`, so `std::is_same_v<T, std::string>` is `false` for the very argument you meant to catch. Strip first: `using U = std::remove_cvref_t<T>;` then test `U`. The same applies to `auto&&` in a range-for.

## decltype and std::declval

`decltype(expr)` is the type of an expression, computed without evaluating it:

```cpp
int i = 0;
decltype(i) j = 1;                 // int
decltype((i)) r = i;               // int& — an extra pair of parentheses makes it an lvalue expression

template <typename A, typename B>
auto add(const A& a, const B& b) -> decltype(a + b) { return a + b; }

template <typename C>
using SizeOf = decltype(std::declval<C>().size());     // the type size() returns, for any C that has one
```

`std::declval<T>()` pretends to produce a `T` inside an unevaluated context — `decltype`, `sizeof`, a `requires` expression — so you can ask what an expression *would* be without needing an object, or even a constructor. It has no definition and calling it in real code is a link error by design. The `decltype(i)` versus `decltype((i))` distinction is a well-known interview question: a name gives the declared type, a parenthesised name is an lvalue expression and gives a reference.

## if constexpr dispatch

Where lesson 5 used `if constexpr` with a concept, the traits version reads the same and predates it:

```cpp
template <typename T>
void describe(const T& v) {
    if constexpr (std::is_integral_v<T>) {
        std::cout << "integral " << v << (v % 2 == 0 ? " even" : " odd") << '\n';
    } else if constexpr (std::is_floating_point_v<T>) {
        std::cout << "floating " << std::llround(v) << '\n';
    } else if constexpr (std::is_same_v<T, std::string>) {
        std::cout << "text of " << v.size() << " chars\n";
    } else {
        std::cout << "other\n";
    }
}
```

Only the branch whose condition is true is instantiated for a given `T`; `v % 2` is never compiled for a `double` and `v.size()` never for an `int`. To make an unsupported type a compile error rather than an `"other"` line, the last branch can `static_assert` — but `static_assert(false)` inside a template is ill-formed on its own (the compiler may reject it before any instantiation), so the idiom is a dependent false: `template <typename> inline constexpr bool always_false = false;` and then `static_assert(always_false<T>, "unsupported type")`. C++23 relaxes this, but the judge is C++20.

## SFINAE and enable_if — the old way

Before concepts, a template was switched on and off with a trick called *substitution failure is not an error*: when substituting a deduced `T` into a candidate's signature produces an invalid type, that candidate is dropped silently instead of ending compilation.

```cpp
template <typename T>
std::enable_if_t<std::is_integral_v<T>, T> half(T v) { return v / 2; }

template <typename T>
std::enable_if_t<std::is_floating_point_v<T>, T> half(T v) { return v / 2; }
```

`std::enable_if_t<false, T>` names a `::type` that does not exist, so for `half(2.5)` the first candidate fails substitution and vanishes, leaving the second. The technique ran a decade of library code and every error it produced was a list of "candidate template ignored: substitution failure" notes. You will read it in older codebases and in the standard library's own headers; you should write the concept version from lesson 5, which says the same thing in the signature and produces a message that names the unmet requirement.

## Compile-time recursion versus constexpr

The original template metaprogramming computed values by recursion and specialisation:

```cpp
template <unsigned N>
struct Factorial { static constexpr unsigned long long value = N * Factorial<N - 1>::value; };
template <>
struct Factorial<0> { static constexpr unsigned long long value = 1; };

static_assert(Factorial<10>::value == 3628800);

constexpr unsigned long long factorial(unsigned n) {      // the modern form
    unsigned long long result = 1;
    for (unsigned i = 2; i <= n; ++i) result *= i;
    return result;
}
static_assert(factorial(10) == 3628800);
```

The template version instantiates eleven classes to compute one number, cannot use a loop, and reports mistakes as a chain of instantiation notes. The `constexpr` function is ordinary C++ evaluated at compile time when its arguments are constants — C++20 allows loops, `std::vector` and `std::string` inside — and Module 16 covers it in depth. The rule that survives: compute *values* with `constexpr` functions, compute *types* with traits.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `std::is_same_v<T, std::string>` with `T&&` parameter | `T` is `std::string&`: false. Strip with `remove_cvref_t`. |
| Testing `std::is_integral_v<T>` to mean "a number to print" | `bool` and `char` are integral too. |
| `std::conditional_t<B, T, F>` with an invalid `F` | Both branches must be valid types. |
| `static_assert(false)` in the last `if constexpr` branch | Ill-formed before C++23; use a dependent false. |
| Plain `if` where `if constexpr` was needed | Every branch compiles for every `T`: `v.size()` on an `int` fails. |
| `decltype((x))` when `decltype(x)` was meant | A reference instead of the declared type. |
| Calling `std::declval<T>()` outside `decltype` | Undefined symbol at link time. |

## Key takeaways

- `is_x_v<T>` predicates and `x_t<T>` transformers are the two halves of `<type_traits>`; both are traits built by specialisation.
- `conditional_t` picks a type from a flag; `remove_cvref_t` recovers the plain type behind a forwarding reference.
- `decltype` names an expression's type unevaluated; `std::declval<T>()` supplies a fake `T` for it.
- `if constexpr` instantiates only the taken branch — the dispatch tool; end with a dependent-false `static_assert` when the rest must not compile.
- SFINAE and `enable_if` are the pre-C++20 constraint; read them, write concepts.
- Compute values with `constexpr` functions, types with traits; recursive template arithmetic is history.
