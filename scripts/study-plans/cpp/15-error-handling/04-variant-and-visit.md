---
title: std::variant and std::visit — a type-safe union
minutes: 14
---
A value that is *one of several types* — a token that is a number or a word, a command that is a push or a pop, a result that is a value or an error — is a sum type, and C's tool for it was the `union`: overlapping storage with no record of which member is live, so reading the wrong one is undefined behaviour. `std::variant`, in `<variant>` since C++17, is a union that remembers. It stores exactly one of its alternatives at a time, tracks which by index, checks every access, and — through `std::visit` — makes the compiler prove that your code handles every alternative. This lesson settles construction and access, the visitor patterns, `std::monostate`, modelling a small command language, and why `std::any` is almost never the tool.

## Declaring, assigning, asking

```cpp
#include <iostream>
#include <string>
#include <variant>

int main() {
    std::variant<int, double, std::string> v;   // holds int 0: the first alternative, default-constructed
    v = 2.5;                                    // now a double
    v = "text";                                 // now a std::string (the const char* converts)
    std::cout << v.index() << '\n';             // 2

    if (std::holds_alternative<std::string>(v)) {
        std::cout << std::get<std::string>(v).size() << '\n';   // 4
    }
    if (auto* d = std::get_if<double>(&v)) {    // pointer to the double, or nullptr
        std::cout << *d << '\n';                // not printed: v holds a string
    }
    std::cout << std::get<2>(v) << '\n';        // by index: text
    return 0;
}
```

A variant is never empty in normal use: default construction builds the first alternative, and assigning a value of another type destroys the current alternative and constructs the new one in the same storage. Access comes in two checked forms. `std::get<T>` (or `std::get<I>`) returns a reference and throws `std::bad_variant_access` when the variant holds something else; `std::get_if<T>` takes a *pointer* to the variant and returns a pointer to the value or `nullptr`, which is the form for an `if`. Two alternatives of the same type — `std::variant<int, int>` — are legal but make `get<int>` ambiguous; address them by index or, better, wrap each in a named struct.

## Visiting

Testing `index()` in an `if`/`else` chain works and is the anti-pattern: add a fourth alternative and every chain silently falls through its last `else`. `std::visit(visitor, v)` calls `visitor(held)` with the held value at its real type, and refuses to compile unless the visitor accepts *every* alternative.

The smallest visitor is a generic lambda, for operations that read the same for every type:

```cpp
std::visit([](const auto& x) { std::cout << x << '\n'; }, v);   // int, double and std::string all stream
```

When each alternative needs its own code, overload the call operator. The standard idiom is a struct that inherits every lambda you hand it:

```cpp
template <typename... Ts>
struct overloaded : Ts... {
    using Ts::operator()...;
};
template <typename... Ts> overloaded(Ts...) -> overloaded<Ts...>;   // C++20 deduces this itself; harmless

std::visit(overloaded{
    [](int i) { std::cout << "int " << i << '\n'; },
    [](double d) { std::cout << "double " << d << '\n'; },
    [](const std::string& s) { std::cout << "string " << s << '\n'; },
}, v);
```

`overloaded` is a class derived from each lambda's closure type (Module 12, lesson 4 covered the pack), and `using Ts::operator()...` pulls every call operator into one overload set, so the call resolves like any overloaded function — exact match first. Leave one alternative out and the error names the type that has no match. A trailing `[](const auto&) { }` is the catch-all when only some alternatives matter, at the cost of the compile-time check.

A visitor may return a value, and then every overload must return the *same* type:

```cpp
int width = std::visit(overloaded{
    [](int) { return 1; },
    [](double) { return 2; },
    [](const std::string& s) { return static_cast<int>(s.size()); },   // size_t would not match int
}, v);
```

## A visitor with state

Lambdas capture, but a visitor that carries state across many visits is clearer as a struct with overloaded `operator()`s:

```cpp
struct Push { long long value; };
struct Pop {};
struct Add {};
using Command = std::variant<Push, Pop, Add>;

struct Executor {
    std::vector<long long>& stack;
    void operator()(const Push& p) const { stack.push_back(p.value); }
    void operator()(const Pop&) const { stack.pop_back(); }
    void operator()(const Add&) const {
        long long b = stack.back(); stack.pop_back();
        stack.back() += b;
    }
};

for (const Command& c : program) std::visit(Executor{stack}, c);
```

Empty structs as alternatives are the C++ spelling of an enum with payloads: `Pop` carries nothing but is still a distinct type the visitor can overload on.

## std::monostate

Because a variant default-constructs its first alternative, a variant whose alternatives are all non-default-constructible cannot be default-constructed at all. `std::monostate` — an empty type that compares equal to itself — goes first to say "nothing yet":

```cpp
std::variant<std::monostate, Connection, Error> state;   // default: monostate
```

It also models a legitimately empty state without reaching for `std::optional<std::variant<...>>`.

## Modelling a small language

A variant of command structs plus a parser and a visitor is a complete interpreter, and the pattern scales to tokens, JSON values and abstract syntax trees. The trade-off it embodies has a name — the *expression problem*. A `std::variant` fixes the set of *types* and leaves the set of *operations* open: anyone can write a new visitor without touching the types. A class hierarchy with virtual functions (Module 10) fixes the set of *operations* and leaves the *types* open: anyone can derive a new class, but a new operation means editing every class. Choose by which axis your program grows. Recursive shapes — an expression that contains expressions — need indirection, because a type cannot contain itself by value:

```cpp
struct Expr;
using Node = std::variant<long long, std::unique_ptr<Expr>>;   // the pointer breaks the recursion
```

## std::any, and why it is rare

`std::any` holds a value of *any* copyable type and remembers which with `typeid`:

```cpp
#include <any>
std::any a = 5;
a = std::string("five");
if (auto* s = std::any_cast<std::string>(&a)) std::cout << *s << '\n';   // pointer form: nullptr on mismatch
int n = std::any_cast<int>(a);                                            // throws std::bad_any_cast
```

There is no `visit` — the holder cannot enumerate what it does not know — and large values are heap-allocated. That is the tell: `any` is for a set of types that is genuinely open at compile time, such as a scripting bridge or a plugin's opaque configuration. When the set is known, `std::variant` is checked and faster; when the code is generic over the type, a template is. Most codebases contain no `std::any` at all.

## Cost

A variant is as large as its largest alternative plus an index, padded, and lives wherever you put it — no heap. `std::visit` compiles to a table dispatch on the index, comparable to a virtual call. One rarely met state exists: if constructing the new alternative during an assignment throws after the old one was destroyed, the variant becomes `valueless_by_exception()` and `visit` throws; a `noexcept` move constructor (lesson 2) makes this impossible for your types.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `std::get<T>` without checking | Throws `std::bad_variant_access` when another alternative is held |
| `if`/`else` on `index()` | A new alternative is silently unhandled; `std::visit` would refuse to compile |
| Visitor overloads returning different types | Compile error: every return must convert to one type |
| `std::variant<int, int>` and `get<int>` | Ambiguous; wrap each in a named struct |
| First alternative not default-constructible | The variant is not default-constructible; put `std::monostate` first |
| A variant that contains itself by value | Incomplete type; go through `std::unique_ptr` or a `std::vector` |
| Reaching for `std::any` with a known set of types | No `visit`, possible heap allocation, a cast per read |

## Key takeaways

- `std::variant<A, B, C>` holds exactly one alternative, tracked by `index()`; default construction builds the first.
- `std::get<T>` throws on a mismatch; `std::get_if<T>(&v)` returns `nullptr` instead — use it in an `if`.
- `std::visit` calls the visitor with the real type and refuses to compile unless every alternative is handled; `overloaded{…}` builds the visitor from lambdas.
- Empty structs are alternatives too; a visitor struct with a reference member carries state.
- `std::monostate` is the "nothing yet" alternative; recursion needs a pointer.
- `std::any` is for a truly open set of types and is almost never the right tool.
