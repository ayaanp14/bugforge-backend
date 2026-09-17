---
title: Passing parameters — by value, by reference, by const reference
minutes: 14
---
How an argument reaches a parameter decides two things: whether the function can change the caller's object, and how much the call costs. C++ gives you the choice explicitly, and the wrong default is the most common performance mistake in beginner code — a `std::vector` of a million elements copied on every call because the parameter said `std::vector<int>` instead of `const std::vector<int>&`. This lesson settles the three ways to pass, the cost model behind the choice, why returning a value beats filling an output parameter, and how to return several things at once.

## Three ways to pass

```cpp
void byValue(std::string s);                  // s is a copy; the caller's string is untouched
void byReference(std::string& s);             // s is the caller's string under another name
void byConstReference(const std::string& s);  // the caller's string, read-only
```

### By value: a copy

The parameter is a fresh object initialised from the argument. Changes inside the function are changes to the copy:

```cpp
void bump(int n) { n += 1; }

int main() {
    int x = 5;
    bump(x);
    std::cout << x << '\n';   // 5 — bump changed its own n
}
```

This is **value semantics** — the same rule that makes `int b = a;` give `b` its own 5. For `int`, `double`, `char`, `bool` and pointers the copy is one register and costs nothing. For a `std::string` or a `std::vector` the copy allocates and copies every element, and the function pays that price on every call whether it needed a copy or not.

### By reference: an alias

`T&` declares the parameter as another name for the caller's object. There is no copy; writes go straight through:

```cpp
void swapValues(int& a, int& b) {
    int tmp = a;
    a = b;
    b = tmp;
}

int x = 1, y = 2;
swapValues(x, y);        // x is 2, y is 1
```

A reference parameter must be given an object it can alias — an **lvalue**. `swapValues(1, 2)` does not compile: there is no variable for `a` to name. That restriction is a feature: a `T&` parameter announces "I will modify what you pass", and the compiler stops you passing something that cannot be modified.

### By const reference: an alias you may only read

`const T&` is the alias without the write access. No copy, no modification, and — because nothing can be changed through it — it also binds to temporaries and literals:

```cpp
std::size_t countVowels(const std::string& text) {   // no copy, however long the text
    std::size_t n = 0;
    for (char c : text) {
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') ++n;
    }
    return n;
}

countVowels(line);            // aliases line
countVowels("temporary");     // a std::string is built from the literal and lives until the call returns
```

## The cost model

| Parameter form | What happens at the call | Use it for |
| --- | --- | --- |
| `T` | a copy is made | `int`, `double`, `char`, `bool`, pointers, iterators, `std::string_view` — anything that fits in a register or two, or when you need your own copy anyway |
| `const T&` | nothing is copied; read only | everything else you only read: `std::string`, `std::vector`, structs, class objects |
| `T&` | nothing is copied; writes go through | the function must change the caller's object |
| `T*` | a pointer is copied | optional arguments (`nullptr` allowed) and C-style APIs — Module 6 |

The rule of thumb: **by value for small things, `const T&` for big things, `T&` only when you mean to modify.** "Small" means about the size of two pointers; `std::string_view` (Module 5, lesson 6) and `std::span` are small by design so they can go by value. Module 19, lesson 2 counts these costs precisely; for now the shape is enough: a copy of a container is O(n) work and an allocation, a reference is a single address.

## Returning by value

The instinct after learning references is to avoid copies on the way out too — to take a `std::vector<int>& out` and fill it. Modern C++ does not need that:

```cpp
std::vector<int> squares(int n) {
    std::vector<int> result;
    result.reserve(n);
    for (int i = 1; i <= n; ++i) result.push_back(i * i);
    return result;            // no copy: elided or moved
}

auto v = squares(5);
```

Since C++17 a returned temporary is constructed directly in the caller's variable (guaranteed copy elision), and a returned local is at worst *moved* — its buffer handed over, not copied — through the machinery Module 9 explains. Returning by value is the right default for any type, including containers and strings.

Returning the answer beats writing it into a parameter for three reasons: the call site reads as an expression (`auto v = squares(5)` rather than `std::vector<int> v; squares(5, v);`), the result can be `const`, and the caller cannot forget to look at it. With an output parameter, input and result travel through the same door, and readers must check the body to learn which is which.

## Returning more than one thing

When a function has two answers, return a **pair** or a **struct**:

```cpp
#include <utility>

std::pair<int, int> minMax(const std::vector<int>& v) {
    int lo = v.front(), hi = v.front();
    for (int x : v) { lo = std::min(lo, x); hi = std::max(hi, x); }
    return {lo, hi};
}

struct Stats { long long sum; int min; int max; };

Stats summarise(const std::vector<int>& v) {
    Stats s{0, v.front(), v.front()};
    for (int x : v) { s.sum += x; s.min = std::min(s.min, x); s.max = std::max(s.max, x); }
    return s;
}

auto [lo, hi] = minMax(values);         // structured bindings, C++17
Stats st = summarise(values);
std::cout << st.sum << ' ' << st.min << '\n';
```

`std::pair` is right when the two halves are of equal standing and short-lived — `first` and `second` say nothing about meaning. A named struct is right the moment a reader would have to guess which member is which; three lines of `struct` cost nothing and document the result forever.

## When an output parameter is still right

- **A result and a success flag together.** `bool tryParse(const std::string& text, int& out)` returns whether it worked and leaves the value in `out`. The modern alternative is `std::optional<int>` (Module 15, lesson 3), but the reference form is everywhere in existing code.
- **Reusing a buffer.** `std::getline(std::cin, line)` writes into a string the caller owns so that reading a million lines does not allocate a million strings.
- **In-out parameters.** A function that *updates* something — `void normalise(std::vector<double>& v)` — is not returning a value at all; the reference is the point.

Outside those cases, return the value.

## Pitfalls

- **`std::vector<int> v` where `const std::vector<int>& v` was meant.** Compiles, runs, gives the right answer — and copies the container on every call, without a warning.
- **Forgetting the `&` on an output parameter.** `void tryDivide(int a, int b, int q, int r)` assigns to its own copies; the caller's variables never change, and nothing reports it.
- **A non-`const` reference to a temporary.** `void f(int& x); f(5);` is an error: there is nothing for `x` to alias. Either take `const int&`, or `int` by value.
- **Returning a reference to a local.** `const std::string& f() { std::string s; return s; }` hands back a name for an object that no longer exists — Lesson 6 covers the lifetime rule.

## Key takeaways

- By value copies (right for small types), `T&` aliases and may write (right for in-out and output parameters), `const T&` aliases and may only read (right for everything else).
- A copy of a container or string is O(n) and allocates; a reference is one address. `const T&` is the default for anything larger than a couple of pointers.
- Return by value: copy elision and moves make it free, and the call site reads as an expression.
- Two results: `std::pair` for equal, anonymous halves; a small `struct` whenever the members have names worth writing.
- Output parameters remain right for success-plus-value, buffer reuse and genuine in-out updates.
