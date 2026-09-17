---
title: constexpr, consteval and compile-time tables
minutes: 15
---
A C++ compiler is also an interpreter. Mark a function `constexpr` and the compiler may run it while compiling, turning a computation into a constant baked into the executable; mark it `consteval` and it *must*. Since C++20 the interpreted subset is most of the language — loops, locals, `std::array`, even `std::vector` and `std::string` inside the function — so lookup tables and unit conversions can be computed before the program starts and *checked* before it starts too, with `static_assert`. This lesson settles what `const` and `constexpr` each promise, what a `constexpr` function may contain, how to force compile-time evaluation, how to build a table in `std::array`, and the one rule about `consteval` that stops most first attempts from compiling.

## const versus constexpr

`const` means *read-only after initialisation*. The value may come from run time:

```cpp
int n;
std::cin >> n;
const int limit = n * 2;      // fine: const, but a run-time value
```

`constexpr` means *a constant expression*: the value is known at compile time and can be used wherever the language demands one — an array bound, a template argument, a `case` label, a `static_assert`.

```cpp
constexpr int MAX_ITEMS = 64;
int buffer[MAX_ITEMS];                    // needs a constant: constexpr qualifies, const-from-cin would not
std::array<int, MAX_ITEMS * 2> wide{};
```

`constexpr` on a variable implies `const`. The distinction to remember for interviews: every `constexpr` variable is `const`, but a `const` variable is only usable in a constant expression when its initialiser was one (`const int k = 5;` is, `const int k = n;` is not). Prefer `constexpr` for anything that is genuinely a constant — the compiler then enforces it.

## constexpr functions: may run at either time

A `constexpr` function is one the compiler is *allowed* to evaluate at compile time. It is still an ordinary function:

```cpp
constexpr long long square(long long x) { return x * x; }

constexpr auto BIG = square(1'000'000);   // evaluated at compile time — the result is a literal
int n;
std::cin >> n;
std::cout << square(n) << '\n';           // evaluated at run time, like any function
```

The same function serves both calls. Whether a call happens at compile time depends on the context: a `constexpr` variable's initialiser, a template argument, an array bound or a `static_assert` *require* it; a plain call with run-time arguments simply runs. A plain call with constant arguments (`std::cout << square(12)`) may be folded by the optimiser but is not guaranteed to be.

What may a `constexpr` function contain? C++11 allowed a single `return`. C++14 allowed loops, locals and assignment. C++20 allowed `try` blocks, virtual calls and — the important one — dynamic allocation, provided the memory is freed before the function returns. That is what lets `std::vector`, `std::string` and most of `<algorithm>` work inside a `constexpr` function:

```cpp
constexpr int sumOfSquares(int n) {
    std::vector<int> squares;                 // lives only during the evaluation
    for (int i = 1; i <= n; ++i) squares.push_back(i * i);
    int total = 0;
    for (int s : squares) total += s;
    return total;                             // the vector is destroyed here; only an int escapes
}
static_assert(sumOfSquares(3) == 14);
```

What it may *not* do during constant evaluation: call a non-`constexpr` function (`std::stoi`, anything from `<iostream>`), read a non-`constexpr` global, use `reinterpret_cast`, declare a `static` local (allowed only from C++23), or invoke undefined behaviour. The last is a feature: signed overflow, an out-of-range `std::array` index or a null dereference inside a compile-time evaluation is a **compile error**, not a silent wrong answer. Constant evaluation is the one place C++ has a full UB checker.

## Forcing evaluation and proving it

Three contexts force compile-time evaluation, and one of them doubles as a test:

```cpp
constexpr auto TABLE = makeTable();        // 1. a constexpr variable
std::array<int, square(4)> grid{};         // 2. a template argument or array bound
static_assert(square(12) == 144);          // 3. a static_assert — and a compile-time unit test
```

`static_assert(cond, "message")` fails the *build* when `cond` is false, costs nothing at run time, and belongs next to every compile-time table: `static_assert(TABLE[20] == 2432902008176640000ULL);` is the cheapest test you will ever write.

Two C++20 keywords remove the "may": `consteval` declares an *immediate function* that can only be evaluated at compile time — a run-time argument is a compile error — and `constinit` declares a static-storage variable that must be initialised at compile time but may still change afterwards, which rules out the static-initialisation-order problems of Module 4, lesson 6.

```cpp
consteval int cube(int x) { return x * x * x; }
constexpr int EIGHT = cube(2);            // fine
int n = 2;
// int bad = cube(n);                     // error: call to consteval function is not a constant expression

constinit int requestCount = cube(0);     // initialised at compile time; ++requestCount is legal later
```

Use `consteval` for things that make no sense at run time (a compile-time hash of a string literal, a table builder) and `constinit` for globals whose initialisation must not depend on other globals.

## Building a table with std::array

The workhorse pattern: a `constexpr` function fills a `std::array` with a loop and returns it, a `constexpr` variable captures it, and a `static_assert` checks a few entries.

```cpp
#include <array>

constexpr int LIMIT = 100;

constexpr std::array<bool, LIMIT + 1> makeSieve() {
    std::array<bool, LIMIT + 1> isPrime{};          // all false
    for (int i = 2; i <= LIMIT; ++i) isPrime[i] = true;
    for (int i = 2; i * i <= LIMIT; ++i) {
        if (!isPrime[i]) continue;
        for (int j = i * i; j <= LIMIT; j += i) isPrime[j] = false;
    }
    return isPrime;
}

constexpr auto SIEVE = makeSieve();
static_assert(SIEVE[97] && !SIEVE[91] && !SIEVE[1]);

bool isPrime(int k) { return k >= 0 && k <= LIMIT && SIEVE[k]; }   // a run-time lookup into compile-time data
```

The array is computed once, by the compiler, and stored in the read-only data of the executable; `isPrime` is a bounds check and a load. It is `std::array` rather than `std::vector` because a `constexpr` *variable* may not own heap memory — a `std::vector` may live *inside* a `constexpr` function but not *be* a `constexpr` global. Return the data in an array whose size is itself a constant.

## The consteval rule that bites

The natural next step is to make the table builder call a `consteval` helper:

```cpp
consteval unsigned long long factorial(unsigned n) {
    unsigned long long f = 1;
    for (unsigned i = 2; i <= n; ++i) f *= i;
    return f;
}

constexpr std::array<unsigned long long, 21> makeTable() {   // constexpr, not consteval
    std::array<unsigned long long, 21> t{};
    for (unsigned i = 0; i <= 20; ++i) t[i] = factorial(i);  // error!
    return t;
}
```

GCC 14 refuses: *"call to consteval function 'factorial(i)' is not a constant expression … 'i' is not const"*. A `constexpr` function might be called at run time, so its body must be valid at run time, and `factorial(i)` with a loop variable is not a constant expression *in that body* — even though this call would only ever run during constant evaluation. The rule: a `consteval` function may be called with non-constant arguments **only from another `consteval` function** (an "immediate function context"). Fix it by making `makeTable` `consteval` too, or by making `factorial` `constexpr`. `consteval` is contagious upward: use it for the whole chain or not at all.

## if constexpr

`if constexpr (cond)` needs `cond` to be a constant expression and **discards** the branch not taken — inside a template, the discarded branch is not even instantiated, so it may contain code that would not compile for that type:

```cpp
template <typename T>
std::string describe(const T& value) {
    if constexpr (std::is_integral_v<T>) return "integer " + std::to_string(value);
    else if constexpr (std::is_floating_point_v<T>) return "real " + std::to_string(value);
    else return "text " + std::string(value);   // std::string("42") would not compile for int — and is not tried
}
```

A plain `if` with a constant condition compiles both branches and picks one; `if constexpr` compiles one. It replaced most uses of tag dispatch and `enable_if` (Module 12, lesson 6). `std::is_constant_evaluated()` (C++20) tells a `constexpr` function which mode it is running in; C++23's `if consteval` is the same test as a statement.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `const int n = read(); int a[n];` | Not a constant expression; GCC accepts it as a VLA extension, standard C++ does not |
| `constexpr int x = std::stoi("5");` | `std::stoi` is not `constexpr`: compile error |
| Calling a `consteval` function with a run-time value | Compile error: not a constant expression |
| Indexing past the array during constant evaluation | Compile error (UB is rejected) — a run-time call would silently misbehave |
| `constexpr std::vector<int> V{1, 2};` at namespace scope | Compile error: the allocation would outlive the evaluation; return a `std::array` |
| A `static` local in a `constexpr` function | Compile error in C++20 (allowed from C++23) |

## Key takeaways

- `const` is read-only; `constexpr` is a compile-time constant and implies `const`.
- A `constexpr` function runs at compile time only when the context demands it (a `constexpr` variable, template argument, array bound, `static_assert`); otherwise it is an ordinary function.
- C++20 `constexpr` bodies may use loops, `std::array`, `std::vector` and `std::string`, provided nothing allocated escapes; UB inside constant evaluation is a compile error.
- `consteval` forces compile time and can take non-constant arguments only from another `consteval` function; `constinit` forces compile-time initialisation of a mutable global.
- Build tables with a `constexpr` function returning `std::array`, capture with `constexpr auto`, and check with `static_assert`.
- `if constexpr` discards the untaken branch, so a template can hold code that is valid for only some types.
