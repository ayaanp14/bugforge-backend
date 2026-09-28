---
title: Function templates — one definition, every type
minutes: 14
seo-title: C++ Function Templates Explained: Deduction and Headers
description: A C++ function template is a recipe the compiler instantiates per type. Template argument deduction, explicit arguments and why templates go in headers.
question: What is a function template in C++?
answer: A function template is a function written with type parameters, such as `template <typename T> T max_of(const T& a, const T& b)`. It is a recipe, not a function: each time it is called with new types, the compiler deduces `T` from the arguments and instantiates a separate function, so `max_of(3, 9)` creates `max_of<int>`. `std::sort`, `std::swap` and `std::max` are function templates.
q: Why must C++ templates be defined in header files?
a: The compiler generates `max_of<int>` where it sees the call, so the complete definition must be visible in that translation unit. With only a declaration in the header and the body in a `.cpp` file, nothing instantiates the version you need and the link fails with an undefined reference. The one-definition rule allows the same template definition in many files.
q: Why does `max_of(3, 2.5)` fail with deduced conflicting types?
a: Template argument deduction never converts arguments. The first argument deduces `T = int` and the second `T = double`, and the two deductions conflict. Either convert one argument yourself or name the type explicitly, as in `max_of<double>(3, 2.5)`, which skips deduction so the `3` converts to `3.0` like any argument.
q: What is the difference between typename and class in a template parameter?
a: None: in `template <typename T>` and `template <class T>` the two keywords mean exactly the same thing, and `T` may be any type, not only a class. Older code tends to write `class`. The keywords differ only elsewhere — `typename` is also what marks a dependent name as a type.
q: Does a non-template overload beat a function template in C++?
a: When both match equally well, yes: overload resolution considers the non-template functions and the deduced template instantiations together, and an exact non-template match wins the tie. A template can still win when it matches better, as when `describe(5L)` picks the template over a `describe(int)` that would need a conversion.
q: What is an abbreviated function template in C++20?
a: A function with an `auto` parameter, such as `void show(const auto& value)`, which is shorthand for `template <typename T> void show(const T& value)`. Each `auto` is its own template parameter, so `add(auto a, auto b)` accepts mixed types. Use the long form when the body needs to name the type.
---
A function fixes the types of its parameters when it is written; a function template takes the types as parameters too, and the compiler writes the function you need the first time you call it. `std::max`, `std::swap`, `std::sort` and `std::make_unique` are all function templates, which is why one `std::sort` sorts `int`s, `std::string`s and your own types without a line of dispatch. This lesson settles how a template is declared, how the compiler deduces `T` from a call, when you must spell the argument out, how a template coexists with ordinary overloads, and why a template lives in a header rather than a `.cpp` file.

## A function that is a recipe

```cpp
#include <iostream>
#include <string>

template <typename T>
T max_of(const T& a, const T& b) {
    return b < a ? a : b;
}

int main() {
    std::cout << max_of(3, 9) << '\n';                                       // T = int
    std::cout << max_of(2.5, -1.0) << '\n';                                  // T = double
    std::cout << max_of(std::string("pear"), std::string("apple")) << '\n';  // T = std::string
    return 0;
}
```

`template <typename T>` introduces a *template parameter*: a placeholder type named `T` that the rest of the declaration may use as if it were a real type. `typename` and `class` mean the same thing in this position; older code writes `class`. The name `max_of` is not a function — it is a recipe, and `max_of<int>`, `max_of<double>` and `max_of<std::string>` are the three functions the compiler generated from it above. Generating one is called *instantiation*, and it happens on demand: a template that is never called produces no code, and a template that is called with four types produces four functions.

The body uses only `<`, not `>` or `==`. That is deliberate and it is the standard library's convention: the fewer operations the body needs, the more types can use it. A type that defines only `operator<` works with `std::sort`, `std::set` and this `max_of` alike.

## Deduction: the compiler reads the arguments

The call `max_of(3, 9)` never mentions `int`. The compiler matches each parameter's pattern (`const T&`) against the argument's type (`int`) and solves for `T`. The rules mirror `auto` from Module 2, lesson 5: a by-value `T` drops references and top-level `const`, and a `const T&` binds to anything and deduces the referenced type. Every parameter that mentions `T` must agree:

```text
error: no matching function for call to 'max_of(int, double)'
note: candidate: 'template<class T> T max_of(const T&, const T&)'
note:   deduced conflicting types for parameter 'T' ('int' and 'double')
```

`max_of(3, 2.5)` is the call that produced that. Nothing is converted during deduction — the compiler does not promote the `3` to `double` the way it would for a plain `double max_of(double, double)` — so the two deductions disagree and the call fails. The fixes are to convert one argument yourself or to name `T` explicitly, next.

The trap that compiles is the string literal. `max_of("pear", "apple")` deduces `T = const char*`, and `b < a` then compares two addresses, not two words: it returns whichever literal the linker placed later in memory. Pass `std::string` values, or write `"pear"s` with `using namespace std::literals;`.

## Explicit template arguments

Angle brackets after the name set the parameters by hand, and deduction is skipped for the ones you name:

```cpp
max_of<double>(3, 2.5);   // T = double; the 3 converts to 3.0 like any argument

template <typename T>
T read_one() {            // nothing to deduce from: T appears only in the return type
    T value;
    std::cin >> value;
    return value;
}
int n = read_one<int>();

template <typename To, typename From>
To convert(const From& from) { return static_cast<To>(from); }
double d = convert<double>(7);   // To named, From deduced as int
```

Explicit arguments fill the parameter list from the left; anything after them is still deduced. That is why `To` comes before `From` in `convert` — the caller names the one that cannot be deduced and lets the argument supply the other — and it is exactly how `std::make_unique<Widget>(a, b)` names the type to build while deducing the constructor arguments.

## More than one type parameter

```cpp
template <typename A, typename B>
auto add(const A& a, const B& b) {
    return a + b;               // return type deduced from the return statement (C++14)
}
add(3, 2.5);                    // A = int, B = double, returns double
```

Independent parameters deduce independently, so mixed types are fine here where `max_of` refused them. With `auto` as the return type the compiler takes the type of the `return` expression; every `return` in the body must then agree, or the function does not compile. When the return type must be spelled from the parameters, the trailing form `auto add(const A& a, const B& b) -> decltype(a + b)` says so (lesson 6 covers `decltype`).

## Templates and overloads together

A template can share its name with ordinary functions, and the compiler chooses among all of them:

```cpp
void describe(int) { std::cout << "int overload\n"; }

template <typename T>
void describe(const T&) { std::cout << "template\n"; }

describe(5);      // int overload: a non-template that matches exactly wins
describe(5L);     // template, T = long: an exact template match beats a conversion
describe(2.5);    // template, T = double
```

The rule is short: deduce the template, then run ordinary overload resolution over every candidate; when a non-template and a template instantiation are equally good, the non-template wins. That tie-break is what lets you handle one awkward type — `const char*`, say — with a plain overload while the template covers everything else, and it is the recommended tool for the job; lesson 3 explains why specialising a function template is the wrong one.

## Abbreviated function templates (C++20)

When you never need to name `T`, the `auto` parameter of a generic lambda (Module 4, lesson 5) is available on an ordinary function too:

```cpp
void show(const auto& value) {          // template <typename T> void show(const T&)
    std::cout << value << '\n';
}

auto add(auto a, auto b) { return a + b; }   // two parameters: template <typename A, typename B>
```

Each `auto` is its own template parameter, so `add(auto, auto)` accepts mixed types. The long form is still required when the body needs `T` — to declare a local `T sum{}`, or to write `std::vector<T>` — and lesson 5 adds a concept in front of the `auto` to say what the type must support.

## A template lives in a header

The compiler generates `max_of<int>` where it sees the call, so the whole definition — not just a declaration — must be visible in that translation unit. Put the template's body in the header. A declaration in `max.h` with the definition in `max.cpp` compiles both files and fails at link time with `undefined reference to 'int max_of<int>(int const&, int const&)'`, because nothing in `max.cpp` asked for the `int` version and so it was never generated. The one-definition rule (Module 1, lesson 2) permits identical template definitions in many translation units; the linker keeps one copy of each instantiation.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `max_of(3, 2.5)` | Deduction conflict: `int` vs `double`. Name `T` or convert one argument. |
| `max_of("pear", "apple")` | `T = const char*`; compares addresses, compiles, wrong. |
| `read_one()` without `<int>` | `T` appears only in the return type: nothing to deduce from. |
| Definition in a `.cpp`, declaration in the header | Undefined reference at link time. |
| `auto` return with `return 1;` in one branch and `return 2.5;` in another | Inconsistent deduction: compile error. |
| Trusting an uncalled template | Only its syntax is checked until something instantiates it. |

## Key takeaways

- A function template is a recipe; each set of template arguments instantiates a separate function, on demand.
- Deduction matches parameter patterns to argument types and never converts: mismatched arguments to one `T` fail.
- `f<double>(…)` names the arguments explicitly, filling from the left; it is the only way when `T` is not deducible.
- Non-template overloads win exact-match ties; use an overload, not a specialisation, for the special case.
- `void f(const auto& x)` is an abbreviated template; each `auto` is its own parameter.
- Templates go in headers, definition and all.
