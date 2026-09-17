---
title: Conversion operators and explicit
minutes: 14
---
C++ converts between types on its own more often than most languages: `int` to `double`, `const char*` to `std::string`, `3` to `Fraction` if `Fraction` has a constructor that takes one integer. Every one of those is a *user-defined* or built-in implicit conversion, and each is a decision someone made — sometimes without noticing. This lesson settles the two mechanisms a class controls, the converting constructor and the conversion operator, what `explicit` switches off, why `explicit operator bool` is the form every modern type uses, which surprising conversions the standard library itself contains, and how user-defined literals let a value be spelt as `2.5_km`.

## Converting constructors

```cpp
class Fraction {
public:
    Fraction(long long n, long long d = 1);   // callable with ONE argument: an implicit conversion from long long
};

Fraction half(1, 2);
Fraction three = 3;          // copy-initialisation: Fraction(3)
Fraction sum = half + 3;     // if operator+ is a free function, the 3 converts to Fraction(3)
```

Any constructor that can be called with a single argument — one parameter, or several with defaults — is a **converting constructor**: the compiler may call it silently wherever a `Fraction` is expected and a `long long` was supplied. That is exactly what makes `half + 3` work with one free `operator+(const Fraction&, const Fraction&)` (lesson 1), and it is exactly what allows `void pay(Fraction); pay(3);` to compile when the author of `pay` never meant an integer to be accepted.

`explicit` keeps the constructor and removes the silence:

```cpp
class Metres {
public:
    explicit Metres(double v) : v_(v) {}
    double value() const { return v_; }
private:
    double v_;
};

Metres a(5.0);                       // direct-initialisation: fine
Metres b{5.0};                       // fine
Metres c = static_cast<Metres>(5.0); // fine, and visibly a conversion
Metres d = 5.0;                      // error: copy-initialisation needs an implicit conversion
void run(Metres); run(5.0);          // error: no implicit conversion from double
```

The rule is the one the standard library follows: a single-argument constructor is `explicit` unless the conversion is lossless, obvious and intended. `std::string` converts from `const char*` implicitly because a string literal *is* a string; `std::vector<int>(5)` is explicit because `std::vector<int> v = 5;` would read as "a vector containing 5", which it is not. `Fraction(long long)` can reasonably stay implicit — an integer is a fraction. `Metres(double)` cannot: a bare `5.0` has no unit.

## Conversion operators

The other direction — from your type *to* another — is a member function named after the target type, with no parameters and no return type:

```cpp
class Fraction {
public:
    operator double() const { return static_cast<double>(num_) / den_; }   // implicit Fraction → double
};

Fraction f(1, 3);
double d = f;               // 0.333…
std::cout << f << '\n';     // no operator<< for Fraction? prints 0.333333 through the conversion
Fraction g(1, 6);
auto s = f + g;             // no operator+ for Fraction? both convert: s is a double, 0.5
```

Each of the last three lines is a silent decision. `std::cout << f` printing a decimal when you forgot `operator<<`, and `f + g` becoming floating-point arithmetic when you forgot `operator+`, are the reasons an implicit conversion operator is almost always wrong: it turns missing overloads into wrong answers instead of compile errors. `explicit operator double() const` keeps the conversion available on request — `static_cast<double>(f)`, `double d(f)` — and refuses everything else.

## explicit operator bool

```cpp
class Result {
public:
    explicit operator bool() const { return ok_; }
    long long value() const { return value_; }
private:
    bool ok_ = false;
    long long value_ = 0;
};

Result r = parse("42");
if (r) { use(r.value()); }          // contextual conversion: allowed
if (!r) { report(); }               // allowed
bool b = r;                         // error
int n = r + 1;                      // error — the whole point
```

A plain `operator bool()` is the worst implicit conversion of all, because `bool` promotes to `int`: with it, `r + 1`, `r == other`, `std::cout << r` and `int n = r;` all compile and all mean nothing. `explicit operator bool` is honoured in exactly the places where "is it true?" is the question — the condition of `if`, `while`, `for` and `?:`, the operands of `!`, `&&` and `||`, and `static_cast<bool>` — and nowhere else. That is why `if (std::cin >> x)`, `if (ptr)` for a `std::unique_ptr`, and `if (opt)` for a `std::optional` all work while `int n = std::cin;` does not: every one of them is an `explicit operator bool`. Use the same form for anything that answers "did it succeed?"; readers already know the idiom.

## Surprises in the standard library

| Code | Result |
| --- | --- |
| `std::string s = "ab";` | Fine — `const char*` converts implicitly by design |
| `std::string s = 'a';` | Compile error: no constructor takes one `char` |
| `std::string s = 65;` | Compile error: no constructor takes one `int` |
| `std::string s; s = 65;` | Compiles: `operator=(char)` accepts the `int` — `s` is `"A"` |
| `std::string s{65};` | Compiles: the `initializer_list<char>` constructor — `"A"` |
| `std::string s('a', 3);` | Compiles: `string(size_type, char)` — 97 copies of the character `'\3'` |
| `std::string s(3, 'a');` | `"aaa"` — the argument order that was meant |
| `std::vector<int> v = 5;` | Compile error: `vector(size_type)` is `explicit` |

The lesson of the table is not the individual rows but their shape: the conversions that compile are the ones with a plausible single-argument path (`int` to `char`), and the compiler never asks whether that was the intent. Brace-initialisation refuses *narrowing* conversions — `std::string s{300}` fails because 300 does not fit a `char` — which is one of the reasons Module 2 recommended braces. Two limits contain the damage. Only **one** user-defined conversion may appear in an implicit chain: with `Fraction(long long)` and `Money(Fraction)`, `Money m = 3;` is an error, since it would need two. And when two conversions match equally well — constructors from `int` and from `double`, called with a `long` — the call is ambiguous and refuses to compile: a diagnostic, not a guess.

## User-defined literals

```cpp
constexpr long double operator""_km(long double v) { return v * 1000.0L; }     // 2.5_km → 2500 m
constexpr unsigned long long operator""_kb(unsigned long long v) { return v * 1024; }

using namespace std::string_literals;         // "text"s  → std::string
using namespace std::chrono_literals;         // 250ms, 2s → durations (Module 16)

auto d = 2.5_km;                              // 2500.0 (long double)
auto size = 4_kb;                             // 4096
auto name = "ada"s;                           // std::string, not const char*
```

A literal operator is a function named `operator""` followed by a suffix, which for user code must begin with an underscore (suffixes without one are reserved for the standard library: `s`, `sv`, `ms`, `i`, `if`). The parameter is `unsigned long long` for an integer literal, `long double` for a floating one, or `const char*, std::size_t` for a string. They are ordinary functions, usually `constexpr`, and they earn their place when a unit is worth spelling at the point of use — `timeout(250ms)` reads better than `timeout(250)` and cannot be mistaken for seconds.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Single-argument constructor without `explicit` | Every function taking your type silently accepts the argument type |
| Implicit `operator double()` | Missing `operator+`/`operator<<` compile anyway and compute the wrong thing |
| `operator bool()` without `explicit` | `r + 1`, `r == s`, `int n = r;` all compile |
| `explicit` on a copy or move constructor | `T a = b;` and returning by value stop compiling |
| Expecting two user-defined conversions to chain | Only one is allowed; the call fails |
| Constructors from `int` and `double`, called with a `long` | Ambiguous call: neither conversion is better |
| A literal suffix without an underscore | Reserved: compile error or a conflict with the library |

## Key takeaways

- A constructor callable with one argument is an implicit conversion from that argument's type; mark it `explicit` unless the conversion is obvious and lossless.
- `operator T()` converts your type *to* `T`; make it `explicit` so that missing overloads are compile errors, not silent floating-point.
- `explicit operator bool` is the standard idiom for "did it succeed?": it works in conditions and with `!`, `&&`, `||`, and nowhere else.
- `s = 65` and `std::string('a', 3)` compile because an `int` converts to `char`; braces reject narrowing, `explicit` rejects the rest.
- At most one user-defined conversion per implicit chain; two equally good candidates are an ambiguity error.
- User-defined literals (`2.5_km`, `250ms`, `"text"s`) are `constexpr` functions named `operator""_suffix`.
