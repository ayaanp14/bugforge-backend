---
title: auto, decltype and structured bindings
minutes: 15
---
Type deduction is where modern C++ stops making you repeat yourself. `auto` lets the compiler write the type it already knows, `decltype` names the type of an expression you cannot spell, and structured bindings take a pair, a tuple, a struct or a map entry apart into named parts in one line. Each has rules that are simple to state and easy to get wrong: `auto` drops references and top-level `const`, `decltype` cares whether you wrote parentheses, and a binding is a copy unless you ask for a reference. This lesson settles those rules, then covers the C++17 `if`/`switch` initialiser, `using` aliases, `nullptr` and the brace-initialisation quirks.

## auto: deduction, exactly

`auto` deduces a type from the initialiser using the same rules as a template parameter. Two rules do almost all the work: **references are dropped**, and **top-level `const` is dropped**.

```cpp
const std::string name = "ada";
auto a = name;          // std::string — a copy, not const
auto& b = name;         // const std::string& — a reference keeps its const
const auto& c = name;   // const std::string& — the safe read-only default
auto* p = &name;        // const std::string*
auto&& d = name;        // const std::string& (a forwarding reference binds to anything)
```

The consequence that bites is the silent copy. `auto row = table[i];` copies the row; `auto& row = table[i];` aliases it. In a range-`for`, `for (auto x : v)` copies every element and `for (auto& x : v)` does not (Module 3, lesson 4). The rule of thumb: `const auto&` to read, `auto&` to modify in place, plain `auto` when you want your own copy or the value is small.

`auto` earns its keep on return values: `auto it = m.find(k);` instead of `std::map<std::string, std::vector<int>>::const_iterator it`. A lambda's type has no name at all, so `auto f = [](int x) { return x * 2; };` is the only way to store one without `std::function`. The other side: `auto n = v.size();` is `std::size_t`, not `int`, and `auto x = 1 / 2;` is `int` — deduction follows the expression, not your intention.

Brace initialisers have one special case. `auto x{1};` is `int` (since C++17, a single element in braces deduces the element type), but `auto y = {1};` and `auto z = {1, 2};` are `std::initializer_list<int>`, and `auto w{1, 2};` does not compile. Use `=` or parentheses with `auto` unless you specifically want the list.

## decltype and decltype(auto)

`decltype(expr)` yields the declared type of an expression without evaluating it — the tool for "the type of *that*", where `auto` would strip something you need.

```cpp
int i = 0;
decltype(i) a = 1;        // int — the declared type of the name
decltype((i)) b = i;      // int& — a parenthesised name is an lvalue expression, so a reference
std::vector<int> v;
decltype(v)::value_type e = 3;   // int
```

The parentheses rule is the trap: `decltype(name)` is the type the name was declared with; `decltype((name))` is `T&` for an lvalue. Templates use `decltype` to name return types that depend on parameters — `auto add(const A& a, const B& b) -> decltype(a + b)` — and to inspect expressions in a `requires` clause (Module 12).

`decltype(auto)` deduces like `decltype` of the initialiser: it keeps references and `const`. Its use is returning exactly what an inner call returns:

```cpp
decltype(auto) first(std::vector<int>& v) { return v[0]; }   // int& — a plain auto would return int
```

Read `decltype(auto)` as "forward the type"; write it only when a reference must survive the deduction.

## Structured bindings

A structured binding declares several names from one object in a single declaration:

```cpp
std::pair<std::string, int> p{"ada", 31};
auto [name, age] = p;                    // copies p, then names its two members

std::tuple<int, int, int> rgb{255, 128, 0};
auto [r, g, b] = rgb;

struct Point { int x; int y; };
Point pt{3, 4};
auto [x, y] = pt;                        // any struct whose non-static data members are all public

int arr[3] = {1, 2, 3};
auto [a0, a1, a2] = arr;                 // built-in arrays too (not pointers)

std::map<std::string, int> ages{{"ada", 31}, {"bob", 25}};
for (const auto& [who, years] : ages) std::cout << who << ' ' << years << '\n';
```

What is happening underneath matters. `auto [name, age] = p;` creates a hidden copy of `p`, and `name` and `age` are names for that copy's members — not new variables, which is why you cannot give them their own types. `auto& [name, age] = p;` binds the hidden object by reference, so writing through `age` modifies `p`; `const auto& [k, v]` is the read-only form and the right one for iterating a map, where the key is `const` inside the pair anyway. The number of names must equal the number of members exactly; there is no `_` to skip one until C++26.

Where bindings shine is the functions that return several values. A `std::map::insert` returns a `std::pair<iterator, bool>`:

```cpp
if (auto [where, inserted] = ages.insert({"cy", 40}); !inserted)
    std::cout << "already had " << where->first << '\n';
```

And a function that returns a struct reads best of all: `auto [lo, hi, sum] = summarise(values);` says what the three results are, where `std::get<2>(result)` says nothing.

## if and switch with an initialiser

C++17 lets `if` and `switch` declare a variable whose scope is the statement:

```cpp
if (auto it = ages.find("bob"); it != ages.end()) {
    std::cout << it->second << '\n';
} else {
    std::cout << "unknown\n";
}
// it does not exist here

switch (const auto cmd = readCommand(); cmd) {
    case Command::Quit: return 0;
    default: break;
}
```

The variable lives in both branches and nowhere after. It fixes two things: a lookup no longer happens twice (`if (m.count(k)) use(m[k])` searches twice; this searches once), and a name that exists only to be tested no longer leaks into the rest of the function. A `std::lock_guard` in the initialiser holds a mutex for exactly the branch (Module 17).

## using aliases and alias templates

`using Name = Type;` replaces `typedef` and reads left to right:

```cpp
using Scores = std::map<std::string, std::vector<int>>;
using Callback = void (*)(int, int);           // a function pointer, readable at last

template <typename T>
using Grid = std::vector<std::vector<T>>;       // alias templates: typedef could not do this
Grid<double> heights(rows, std::vector<double>(cols));
```

A container type that appears three times deserves an alias; one that appears once does not. Aliases do not create a new type — `Scores` *is* `std::map<…>` — so they change nothing at run time and cannot be overloaded on.

## nullptr

`nullptr` is a keyword of type `std::nullptr_t` that converts to any pointer type and to nothing else. `NULL` and `0` are integers that happen to convert to pointers, which is why `f(NULL)` with overloads `f(int)` and `f(const char*)` picks `f(int)` (or is ambiguous, depending on how the platform defines `NULL`) while `f(nullptr)` picks the pointer overload. Write `nullptr`; treat `NULL` in new code as a review comment.

## Uniform initialisation and the initializer_list quirk

Braces initialise anything — aggregates, classes with constructors, built-in values — and reject narrowing conversions (`int x{2.5};` is an error; `int x = 2.5;` silently truncates). `T{}` value-initialises, so `int n{};` is `0` and never an uninitialised read. The quirk: when a class has a constructor taking `std::initializer_list`, braces prefer it over every other constructor.

```cpp
std::vector<int> a(3, 5);     // three fives:      5 5 5
std::vector<int> b{3, 5};     // two elements:     3 5
std::vector<int> c{3};        // one element, 3 — not three elements
std::string s(3, 'x');        // "xxx"; std::string t{3, 'x'} is two chars: '\x03' and 'x'
```

The rule: braces mean "these are the elements" for containers; parentheses mean "these are the constructor arguments". And `T t();` declares a function, not a default-constructed `t` — the "most vexing parse", which `T t{};` avoids.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `auto row = grid[i]; row[0] = 1;` | Modifies a copy; the grid is unchanged. Use `auto&`. |
| `auto n = v.size(); for (int i = 0; i < n; …)` | Signed/unsigned comparison warning; `n` is `std::size_t` |
| `decltype((x))` when `decltype(x)` was meant | A reference type; the variable must be initialised |
| `auto [a, b] = triple;` | Compile error: the count must match |
| `for (auto [k, v] : m)` on a large map | Copies every entry; use `const auto&` |
| `std::vector<int> v{10};` to get ten elements | One element, 10. Use parentheses |
| `Widget w();` | Declares a function; `Widget w{};` or `Widget w;` |

## Key takeaways

- `auto` copies: it drops references and top-level `const`; `auto&`, `const auto&` and `auto*` keep what you ask for.
- `decltype(name)` is the declared type; `decltype((name))` is a reference; `decltype(auto)` forwards a return type exactly.
- `auto [a, b] = obj;` names the members of a hidden copy; `auto& [a, b]` aliases the original; the count must match.
- `if (init; cond)` and `switch (init; expr)` scope a lookup to the statement and search once.
- Braces reject narrowing and prefer `std::initializer_list`: `vector<int>{3, 5}` is two elements, `(3, 5)` is three.
- `using` aliases and alias templates name types without creating new ones; `nullptr` is the only null.
