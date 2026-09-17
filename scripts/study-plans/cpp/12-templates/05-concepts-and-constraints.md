---
title: Concepts and constraints — saying what T must be
minutes: 15
---
Every template has requirements: `max_of` needs `<`, `sum` needs `+`, `std::sort` needs a random-access range of things that compare. Before C++20 those requirements lived only in the body, so a wrong argument produced an error from deep inside the template — forty lines of notes ending in a line of library code you did not write. Concepts move the requirement to the signature, where the compiler can check it at the call and say which one failed. This lesson covers `requires` clauses and the standard concepts, writing your own concept with a `requires` expression, constrained `auto`, overloading on concepts and the subsumption rule, and `if constexpr` as the in-body companion.

## The problem, measured

```cpp
template <typename T>
T max_of(const T& a, const T& b) { return b < a ? a : b; }

struct Point { int x, y; };
max_of(Point{1, 2}, Point{3, 4});
```

```text
error: no match for 'operator<' (operand types are 'const Point' and 'const Point')
    return b < a ? a : b;
           ~~^~~
note: required from 'T max_of(const T&, const T&) [with T = Point]'
```

Two lines here; with `std::sort` on a vector of `Point` the same mistake produces a page, because the missing `<` is discovered six calls down inside `<bits/stl_algo.h>`. The template was honest about nothing: its signature said "any `T`", and only the body knew better.

## requires clauses and the standard concepts

```cpp
#include <concepts>

template <typename T>
    requires std::integral<T>                // a requires clause after the template header
T half(T v) { return v / 2; }

template <std::floating_point T>             // the same constraint, shorthand
T half(T v) { return v / 2; }

void show(std::integral auto v) {            // constrained auto: an abbreviated template with a requirement
    std::cout << v << '\n';
}
```

All three spellings declare a template whose parameter must satisfy a concept; choose by taste and keep one style per file. Now `half(Point{})` fails at the call: `error: no matching function … note: constraints not satisfied … 'std::integral<Point>' evaluated to 'false'`. Two lines, naming the requirement, pointing at your code.

`<concepts>` supplies the vocabulary. The ones you will use: `std::integral`, `std::signed_integral`, `std::unsigned_integral`, `std::floating_point`; `std::same_as<T, U>` and `std::convertible_to<From, To>`; `std::derived_from<D, B>`; `std::invocable<F, Args...>` and `std::predicate<F, Args...>` for callables; `std::equality_comparable` and `std::totally_ordered`; `std::copyable`, `std::movable`, `std::default_initializable`; and `std::ranges::range` from `<ranges>`. Two details bite: `bool` and `char` satisfy `std::integral` — they are integer types to the language — and there is no `std::arithmetic`; write `std::integral<T> || std::floating_point<T>` or name it yourself, next.

## Writing a concept

A concept is a named compile-time predicate on types, and a `requires` expression is how you state what code must be valid:

```cpp
template <typename T>
concept Number = std::integral<T> || std::floating_point<T>;

template <typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;      // compound requirement: valid, and its type converts to T
};

template <typename S>
concept Shape = requires(const S& s) {
    { s.area() } -> std::convertible_to<double>;
    { s.name() } -> std::same_as<std::string>;
};

template <typename C>
concept Container = requires(C c) {
    typename C::value_type;                    // type requirement: this nested name must exist
    c.begin();                                 // simple requirement: this expression must compile
    { c.size() } -> std::convertible_to<std::size_t>;
    requires std::copyable<C>;                 // nested requirement: another constraint must hold
};

static_assert(Addable<int>);
static_assert(Addable<std::string>);           // + concatenates: satisfied
static_assert(!Addable<std::vector<int>>);     // no operator+: not satisfied, and that is a fact, not an error
```

The parameters of a `requires` expression are never created and its body is never executed — it is checked, not run, and the result is a `bool` you can `static_assert`, combine with `&&` and `||`, or test in `if constexpr`. Four kinds of requirement cover everything: a simple expression, a type name, a compound `{ expr } -> concept` that also checks the result's type, and a nested `requires`. Note the return-type check is itself a concept applied to the expression's type, so `-> std::same_as<std::string>` means "exactly `std::string`", while `-> std::convertible_to<double>` also admits `float` and `int`.

A concept checks syntax, not meaning. `Addable<std::string>` is true because `+` compiles; whether concatenation is what a `sum` should do to strings is a decision the concept cannot make for you.

## Overloading on concepts and subsumption

```cpp
template <std::integral T>       void classify(T) { std::cout << "integral\n"; }
template <std::floating_point T> void classify(T) { std::cout << "floating\n"; }
template <typename T>            void classify(T) { std::cout << "something else\n"; }

classify(7);      // integral
classify(2.5);    // floating
classify("s");    // something else
```

Overload resolution treats a satisfied constraint as a tie-breaker: when two templates match equally well, the constrained one beats the unconstrained one, and between two constrained ones the *more constrained* wins — provided the compiler can prove one subsumes the other. It can when the constraints are built from named concepts: `std::signed_integral<T>` is defined as `std::integral<T> && std::is_signed_v<T>`, so an overload constrained on `signed_integral` subsumes one constrained on `integral` and wins for `int`. It cannot see through a `requires` expression you wrote inline: two overloads with hand-written `requires(T a) { a + a; }` clauses are never equivalent even when the text is identical, and the call is ambiguous. Name your concepts and build the specific ones from the general ones.

## Constrained auto everywhere

The `auto` in front of a variable, a return type or a lambda parameter accepts the same prefix:

```cpp
std::integral auto n = read_count();                // fails to compile if read_count() returns double
std::floating_point auto mean(const auto& v) { … }  // the return type is checked, the parameter is any type
auto is_even = [](std::integral auto x) { return x % 2 == 0; };
```

The check happens when the type is deduced, so a constrained variable documents an assumption the compiler then enforces — the modern replacement for a comment saying `// must be an integer`.

## if constexpr

A concept is a `bool`, and `if constexpr` chooses code at compile time, so the two fit together for the case where one function handles several kinds of type with a few lines of difference:

```cpp
template <typename T>
std::string describe(const T& v) {
    if constexpr (std::integral<T>) return "integral " + std::to_string(v);
    else if constexpr (std::floating_point<T>) return "floating " + std::to_string(v);
    else return "something else";
}
```

The branch not taken is *discarded*: it is not instantiated for that `T`, so `std::to_string(v)` in the first branch is never compiled for a `std::string` argument. An ordinary `if` would try, and fail. Lesson 6 makes this the centre of a whole dispatch style.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `requires T` instead of `requires std::integral<T>` | A constraint must be a `bool` expression: compile error. |
| A `requires` clause in the wrong place | It goes after the template header or after the parameter list, not between the name and the parameters. |
| Two inline `requires` expressions on two overloads | Never subsume each other: ambiguous call. |
| Forgetting `#include <concepts>` | `std::integral` is undeclared. |
| Assuming `bool` is not `std::integral` | It is; add `&& !std::same_as<T, bool>` when that matters. |
| Reading `Addable<T>` as "addition makes sense" | It means only that `a + b` compiles. |
| `requires requires (T t) { … }` on a function | Legal ad-hoc constraint, but a sign the concept deserves a name. |

## Key takeaways

- A concept moves a template's requirement into its signature, so a bad argument fails at the call with a two-line message.
- `requires C<T>`, `template <C T>` and `C auto` are three spellings of the same constraint.
- A `requires` expression lists code that must be valid — expressions, types, result types, nested constraints — and is a `bool`.
- Constrained overloads beat unconstrained ones; more-constrained beats less, but only through named concepts.
- `bool` and `char` are `std::integral`; there is no `std::arithmetic` concept.
- `if constexpr` discards the branch not taken, so one body can serve several kinds of type.
