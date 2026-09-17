---
title: Const correctness — reading declarations right to left
minutes: 13
---
`const` is the promise "this code does not modify that object", and the compiler enforces it. Placed on a parameter it tells the caller their object is safe; placed on a member function it tells a `const` object which operations are allowed; placed on a pointer it says whether you may change the pointee, the pointer, or neither. This lesson settles the three pointer placements and the right-to-left reading rule, the conversions `const` allows and forbids, why the property spreads through a codebase, and why `const_cast` is a warning sign rather than a tool.

## Three placements, one reading rule

```cpp
int x = 1, y = 2;

const int* a = &x;         // pointer to const int
int const* b = &x;         // the same type, written the other way round
int* const c = &x;         // const pointer to int
const int* const d = &x;   // const pointer to const int
```

Read each declaration from the name, right to left:

| Declaration | Reads as | `*p = 5` | `p = &y` |
| --- | --- | --- | --- |
| `const int* p` | p is a pointer to a const int | error | ok |
| `int const* p` | the same | error | ok |
| `int* const p` | p is a const pointer to an int | ok | error |
| `const int* const p` | p is a const pointer to a const int | error | error |

The rule that generates the table: `const` **left** of the `*` applies to what is pointed at; `const` **right** of the `*` applies to the pointer itself. `const int*` and `int const*` differ only in style; `const T*` is what most code writes. The same reading works for references — `const int& r` is "r is a reference to a const int" — and there is no `int& const`, because a reference cannot be reseated anyway.

`int* const` is rare in practice: a pointer you never reseat is usually a reference. `const int*` is everywhere — every "look but do not touch" parameter and every `begin`/`end` pair over data you only read.

## What const on the pointee actually promises

```cpp
int x = 1;
const int* p = &x;
// *p = 2;               // error: assignment of read-only location
x = 2;                   // fine: x itself is not const
std::cout << *p << '\n'; // 2 — p sees the change
```

`const int*` restricts *your access through `p`*, not the object: anyone holding `x`, or an `int*` to it, may still write, and `p` observes the new value. `const` on a pointer or reference describes the view, not the thing.

## Conversions: adding const is free, removing it is a cast

```cpp
int x = 1;
int* p = &x;
const int* cp = p;               // fine: int* → const int* adds a restriction
// int* q = cp;                  // error: would drop the restriction silently
int* q = const_cast<int*>(cp);   // compiles, and is the smell discussed below
```

`T*` converts implicitly to `const T*`, `T&` to `const T&`, and a `std::vector<int>` argument binds to a `const std::vector<int>&` parameter. Going the other way needs `const_cast`, on purpose, in writing. This asymmetry is the design: a function that takes `const T&` can be called with anything, and it cannot leak a non-const handle out.

## Parameters

Module 4 gave the three choices — `T`, `T&`, `const T&` — and `const` is what makes the third one honest. A `const std::string&` parameter costs one pointer to pass, accepts a literal (a temporary binds to it, lesson 4), and guarantees the caller's string comes back unchanged:

```cpp
int count_char(const std::string& text, char c) {
    int n = 0;
    for (char ch : text) {
        if (ch == c) ++n;
    }
    return n;
}
```

A top-level `const` on a *by-value* parameter — `void f(const int n)` — protects only the function's own copy; it means nothing to callers.

## const member functions — a preview

```cpp
struct Counter {
    int value = 0;
    int get() const { return value; }   // promises not to modify *this
    void add(int n) { value += n; }     // may modify
};

void report(const Counter& c) {
    std::cout << c.get() << '\n';       // OK: get() is const
    // c.add(1);                        // error: add() is not const
}
```

A `const` object — or a `const Counter&`, which is how most objects arrive in a function — may only call member functions marked `const`. The standard library follows this throughout: `size()`, `at()`, `front()` and `find()` all have `const` versions, so a `const std::vector<int>&` is fully readable. Module 8 lesson 3 covers `const` members in depth, including `mutable`.

## Why const is contagious — and worth it

Suppose `Counter::get` were not `const`. Then `report` fails to compile, and so does every function that takes `const Counter&` and calls `get`, and every `const auto&` loop over a container of `Counter`s. The fix is to add `const` where it belongs (on `get`) — or to strip `const` from every parameter on the way up, which lies to every caller.

That is the contagion, and it points in a good direction. Write every read-only parameter as `const T&`, every non-mutating member function as `const`, every read-only pointer as `const T*`, and the compiler proves, for free and forever, which code changes what: when something *is* modified unexpectedly, the suspects are exactly the non-const code. Retrofitting `const` onto a codebase that ignored it is painful, which is why it is a day-one habit rather than a cleanup.

## const_cast is a smell

```cpp
const int limit = 100;
const_cast<int&>(limit) = 200;    // undefined behaviour: limit was declared const
```

`const_cast` removes `const` from a pointer or reference. Writing through the result is defined only if the object was *not* declared `const` — `limit` may live in read-only memory, or the compiler may have folded `100` into every use. The one legitimate use is calling a `const`-incorrect legacy API that you know does not write; in your own code, a `const_cast` means a signature is wrong.

## Reading harder declarations

| Declaration | Reads as |
| --- | --- |
| `const char* s` | pointer to const char — a read-only C string |
| `const char* const* argv` | pointer to const pointer to const char |
| `int* const& r` | reference to a const pointer to int |
| `const int* p[3]` | array of 3 pointers to const int |
| `int (*p)[3]` | pointer to an array of 3 int |

Right to left, parentheses first. `const T*`, `const T&` and `T* const` cover almost everything you write.

## Pitfalls

- **The const on the wrong side.** `int* const` when you meant `const int*` compiles and protects the wrong thing.
- **Believing `const int*` freezes the object.** It restricts your view; the object may still change under you.
- **`const auto` versus `const auto&`.** `for (const auto x : v)` copies each element; `const auto&` does not.
- **Non-const getters.** One missing `const` on a member function blocks every `const` user of the class.

## Key takeaways

- Read declarations right to left: `const` left of `*` is the pointee, right of `*` is the pointer.
- `const T*` and `const T&` describe *your* access; the object can still change through other names.
- Adding `const` is implicit; removing it is `const_cast`, and writing through it to a truly const object is undefined behaviour.
- `const` member functions are what make `const T&` parameters usable; mark every non-mutating one.
- Const correctness spreads by construction, which is exactly why it must start on day one.
