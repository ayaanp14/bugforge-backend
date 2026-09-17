---
title: Non-type and variadic templates — numbers and packs as parameters
minutes: 14
---
A template parameter does not have to be a type. `std::array<int, 4>` takes a number, `std::bitset<64>` takes a number, and `std::tuple<int, std::string, double>` takes as many types as you give it. Both ideas — a *non-type* parameter that is a compile-time value, and a *parameter pack* that stands for any number of arguments — are what let a container know its size without storing it and a `print` function accept three arguments of three types. This lesson covers non-type parameters, packs and `sizeof...`, recursion over a pack, and the C++17 fold expressions that replace most of that recursion with one line.

## Non-type template parameters

```cpp
#include <array>
#include <cstddef>

template <typename T, std::size_t N>
class Ring {                                // a fixed-capacity buffer that overwrites its oldest entry
public:
    static constexpr std::size_t capacity = N;

    void push(const T& value) {
        data_[(start_ + size_) % N] = value;
        if (size_ < N) ++size_;
        else start_ = (start_ + 1) % N;     // full: the slot we just wrote was the oldest
    }
    std::size_t size() const { return size_; }
    const T& at(std::size_t i) const { return data_[(start_ + i) % N]; }   // 0 = oldest

private:
    std::array<T, N> data_{};
    std::size_t start_ = 0;
    std::size_t size_ = 0;
};

Ring<int, 4> recent;                        // N = 4, baked into the type
```

`std::size_t N` declares a parameter that is a value, and every use of `N` inside the class is a compile-time constant: it sizes the `std::array`, it is the modulus, and it can initialise a `static constexpr` member. There is no `size` field for the capacity because the capacity is part of the type — `sizeof(std::array<int, 4>)` is 16 bytes, exactly four `int`s, which is the reason `std::array` exists (Module 6). `Ring<int, 4>` and `Ring<int, 8>` are different types, as unrelated as `Stack<int>` and `Stack<long>` were in lesson 2.

The argument must be a constant expression. `int n; std::cin >> n; Ring<int, n> r;` is refused with `the value of 'n' is not usable in a constant expression`; a `const int n = 4;` is fine because its initialiser is a constant, while `const int n = read();` is not. When the size genuinely comes from input, either dispatch at run time to a few fixed instantiations — `if (n == 4) run<4>(); else run<8>();` — or use a `std::vector`.

Allowed kinds: integers and enumerations, pointers and references to objects with static storage, `std::nullptr_t`, and since C++20 floating-point values and class types whose members are all public. `template <auto V>` lets the parameter's type be deduced from the argument. Non-type parameters can also be deduced from a call: `template <typename T, std::size_t N> std::size_t length(const T (&)[N]) { return N; }` learns the length of a built-in array from the argument's type, which is how `std::size(arr)` works.

## Parameter packs

```cpp
#include <iostream>

template <typename... Ts>                   // Ts is a pack of types
void count_args(const Ts&... args) {        // args is a pack of parameters
    std::cout << sizeof...(args) << " arguments\n";
}

count_args(1, 2.5, "three");                // Ts = {int, double, char[6]}: 3 arguments
count_args();                               // an empty pack is legal: 0 arguments
```

`typename... Ts` declares a pack; `Ts...` or `args...` *expands* it — the compiler replaces the expansion with a comma-separated list, one entry per element. `sizeof...` gives the count without expanding. Expansion can carry a pattern: `f(args)...` becomes `f(a1), f(a2), f(a3)`, and `std::forward<Ts>(args)...` is the pattern `std::make_unique` uses to pass every constructor argument through unchanged. A pack can be empty, which matters when you write the base case below.

## Recursion over a pack

Before C++17 the only way to *do something with each element* was to peel one off and recurse:

```cpp
void print() { std::cout << '\n'; }                          // base case: the empty pack

template <typename First, typename... Rest>
void print(const First& first, const Rest&... rest) {
    std::cout << first;
    if (sizeof...(rest) > 0) std::cout << ' ';
    print(rest...);                                          // one shorter each time
}

print("total", 3, 2.5);                                      // total 3 2.5
```

`print("total", 3, 2.5)` instantiates `print<char[6], int, double>`, which calls `print<int, double>`, then `print<double>`, then the non-template `print()`. Four functions for one call, and the base case is not optional — without it the last call `print()` has no candidate and the error names it. `if constexpr (sizeof...(rest) > 0) print(rest...);` (lesson 6) removes the need for the base case by not compiling the recursive call when the pack is empty. The peel-one-off shape is still the right one when the first element is special: a separator argument, a format string, a stream.

## Fold expressions (C++17)

A fold applies one binary operator across the whole pack in a single expression:

```cpp
template <typename... Ts>
auto sum(Ts... xs) { return (xs + ...); }             // unary right fold: x1 + (x2 + (x3))

template <typename... Ts>
auto sum_from_zero(Ts... xs) { return (0 + ... + xs); } // binary left fold: ((0 + x1) + x2) + x3

template <typename... Ts>
bool all(Ts... flags) { return (... && flags); }      // true for an empty pack

template <typename... Ts>
void print_all(const Ts&... xs) {
    ((std::cout << xs << ' '), ...);                  // fold over the comma operator: one statement per element
    std::cout << '\n';
}
```

| Form | Spelling | Expands to |
| --- | --- | --- |
| unary right fold | `(pack op ...)` | `x1 op (x2 op (x3))` |
| unary left fold | `(... op pack)` | `((x1 op x2) op x3)` |
| binary right fold | `(pack op ... op init)` | `x1 op (x2 op init)` |
| binary left fold | `(init op ... op pack)` | `(init op x1) op x2` |

The parentheses are part of the syntax. Left and right differ only when the operator is not associative — `(xs - ...)` and `(... - xs)` give different answers — and the binary forms supply a starting value, which is what makes them legal on an empty pack: `(xs + ...)` with no arguments is a compile error, `(0 + ... + xs)` is `0`. Only `&&`, `||` and `,` may fold an empty pack unaided, giving `true`, `false` and nothing. The comma fold is the everyday one: it runs an expression once per element, in order, and replaces the whole recursive `print`. `(std::cout << ... << xs)` is a binary left fold over `<<` that prints every element with no separator.

## Variadic class templates

`std::tuple<Ts...>` stores one member per pack element; `std::variant<Ts...>` stores one of them at a time (Module 15). The one variadic class you will write yourself is the visitor helper:

```cpp
template <typename... Fs>
struct Overloaded : Fs... {                 // inherit from every lambda
    using Fs::operator()...;                // and pull in every call operator
};
```

Passed to `std::visit`, it lets a handful of lambdas act as one overload set; Module 15 shows the whole idiom.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `Ring<int, n>` with a run-time `n` | Not a constant expression: compile error. |
| Passing `Ring<int, 4>` to a function taking `Ring<int, 8>&` | Different types: no match. |
| `(xs + ...)` on an empty pack | Compile error; use `(0 + ... + xs)`. |
| Recursion without a base case | `no matching function for call to 'print()'`. |
| `f(args...)` when you meant `f(args)...` | Passes all arguments to one call instead of calling once per argument. |
| `sizeof(Ts)...` for `sizeof...(Ts)` | The former is a list of sizes, not a count. |
| Reading `(xs - ...)` as left to right | It is a right fold: `x1 - (x2 - x3)`. |

## Key takeaways

- A non-type parameter is a compile-time value baked into the type; `std::array<T, N>` stores no size because `N` is the type.
- A template argument must be a constant expression; dispatch run-time values to a few fixed instantiations.
- `typename... Ts` declares a pack, `Ts...` expands it, `sizeof...(Ts)` counts it, and a pack may be empty.
- Recursion peels one element per call and needs a base case; `if constexpr` can replace it.
- Fold expressions apply one operator across a pack; the binary forms are safe on an empty pack, and the comma fold runs code per element.
