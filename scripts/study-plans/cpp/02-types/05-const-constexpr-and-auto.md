---
title: const, constexpr and auto
minutes: 14
---
Three keywords decide how much the compiler knows about a variable. `const` promises the value will not change after initialisation; `constexpr` promises it is known while compiling; `auto` asks the compiler to work the type out from the initialiser. Used well, each removes a class of mistakes — an accidental assignment, a run-time computation that should have been folded, a silently wrong numeric type. Used carelessly, each hides something. This lesson gives the rules, including the deduction rules for `auto` that most people learn by tripping over them.

## `const` variables

```cpp
const int limit = 100;
limit = 200;                      // error: assignment of read-only variable
const int rounds = readCount();   // fine: const is about after initialisation, not about compile time
const std::vector<int> table{1, 2, 3};
table.push_back(4);               // error: only const member functions may be called (Module 8)
```

A `const` object must be initialised and cannot be assigned afterwards. The initial value may come from anywhere, including input. The habit worth forming is *const by default*: declare every local `const` unless it changes, so that the ones that do change are the ones a reader looks at. It also turns a whole family of typos into compile errors, and it lets the compiler keep the value in a register without ever checking memory again.

## `const` references

```cpp
int x = 5;
const int& view = x;      // an alias that cannot be used to modify x
const double& d = 2.5;    // binds to a temporary and extends its lifetime to the reference's scope
int& bad = 2.5;           // error: a non-const lvalue reference cannot bind to a temporary
```

A `const T&` binds to anything — a variable, a literal, the result of a function call — without copying, which is why it is the default parameter type for anything bigger than a register (Module 4). A plain `T&` binds only to something that already has a name.

## `constexpr` variables

```cpp
constexpr int kMaxUsers = 1'000;
constexpr double kPi = 3.141592653589793;
int buckets[kMaxUsers / 10];               // a constant expression is required here
static_assert(kMaxUsers % 10 == 0);
constexpr int fromInput = readCount();     // error: not a constant expression
```

`constexpr` on a variable means "initialised by a constant expression and usable wherever the compiler needs a number": array bounds, template arguments, `static_assert`, `case` labels. Every `constexpr` variable is also `const`; the reverse is not true.

## `constexpr` functions

```cpp
constexpr long long factorial(int n) {
    long long result = 1;
    for (int i = 2; i <= n; ++i) result *= i;
    return result;
}

static_assert(factorial(20) == 2432902008176640000LL);   // evaluated by the compiler
int n;
std::cin >> n;
std::cout << factorial(n) << '\n';                        // evaluated at run time, same code
```

A `constexpr` function is an ordinary function that the compiler is *allowed* to evaluate during compilation when every argument is a constant and the result is needed in a constant expression. Otherwise it is called at run time like any other. C++20 permits loops, local variables, `if`, and even `std::vector` and `std::string` inside the compile-time evaluation (as long as they are gone by the end of it); it forbids undefined behaviour, so a `constexpr` call that overflows is a compile error rather than a silent wrap — a useful side effect. `consteval` (C++20) marks a function that *must* be evaluated at compile time, and `constinit` a variable that must be initialised then; Module 16 goes deeper.

| | `const` | `constexpr` |
| --- | --- | --- |
| Value known at | run time is fine | compile time, always |
| Can be initialised from input | yes | no |
| Usable as an array bound or in `static_assert` | only if the initialiser was a constant | yes |
| Applies to functions | (member functions: Module 8) | yes — "may run at compile time" |

## `auto`: the deduction rules

`auto` uses the same rules as template argument deduction (Module 12), which come down to four cases:

```cpp
const int cx = 10;
int x = 5;

auto a = cx;          // int — a COPY; the reference-ness and top-level const of the initialiser are dropped
a = 11;               // fine, a is a mutable int
auto& r = cx;         // const int& — auto& keeps the reference and therefore the const
const auto& cr = x;   // const int& — binds to anything, never copies, never modifies
auto* p = &x;         // int* — say the star when you mean a pointer
```

Rule 1 is the one that matters: `auto x = expr;` is always a copy. That is safe for an `int` and expensive for a `std::vector`, and it is the reason the range-for idiom is `for (const auto& item : items)` when reading and `for (auto& item : items)` when modifying — `for (auto item : items) item *= 2;` doubles a copy and leaves the container untouched.

Literals fix the deduced type, so the literal's suffix is the type annotation:

```cpp
auto i = 0;            // int
auto u = 0u;           // unsigned
auto l = 0L;           // long
auto ll = 0LL;         // long long
auto d = 0.0;          // double
auto f = 0.0f;         // float
auto c = 'c';          // char
auto s = "text";       // const char* — NOT std::string
auto big = 10'000'000'000;   // long: the literal did not fit an int
auto n = v.size();     // std::size_t — the right type without spelling it
```

`auto list = {1, 2, 3};` deduces `std::initializer_list<int>`, which is almost never wanted; write `std::vector<int>`.

## `decltype` in brief

`decltype(expr)` names the type of an expression without evaluating it. `decltype(x)` for a variable is its declared type; `decltype((x))`, with the extra parentheses, is the type of the *expression* `x`, an lvalue, so it is `int&`. It matters in templates (Module 12) and in `decltype(auto)` (Module 16); in everyday code you will meet it in `decltype(v)::value_type` and similar spellings.

## When `auto` helps, and when it hides

`auto` earns its place when the type is obvious from the right-hand side (`auto p = std::make_unique<Widget>()`), when only the compiler can name it (a lambda, an iterator over a nested map), and when it prevents a silent conversion (`auto n = v.size()` is `std::size_t`; `int n = v.size()` narrows). It hides when the numeric type is the point:

```cpp
auto total = 0;                 // int — overflows at 2 billion; write 0LL or long long total = 0;
auto mean = sum / count;        // integer division if both are integers; nobody can see it
auto name = "Ada";              // const char*; name.size() does not compile
```

The working rule: `auto` for types that are obvious or unnameable; the explicit type for numbers whose width or signedness matters, and for anything a reader would otherwise have to look up.

## Pitfalls

- `auto x = someConstRef;` makes a mutable copy — surprising when the copy is a large container.
- `auto& r = 5;` does not compile; `const auto& r = 5;` does.
- `for (auto e : v) e = 0;` modifies nothing.
- `auto sum = 0;` then summing millions of values: it is an `int`.
- `constexpr int n = readInt();` — a run-time value can be `const`, never `constexpr`.

## Key takeaways

- `const` is a promise not to modify after initialisation; the value may come from run time. Make locals `const` by default.
- `const T&` binds to anything, including temporaries, without a copy; `T&` needs an lvalue.
- `constexpr` variables are compile-time constants; `constexpr` functions run at compile time when their arguments are constants and at run time otherwise, and `static_assert` proves it.
- `auto x = expr` copies and drops references and top-level `const`; `auto&` and `const auto&` keep them; literal suffixes choose the numeric type.
- Use `auto` when the type is obvious or unnameable; spell the type when a number's width or signedness matters.
