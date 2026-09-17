---
title: The cost model — counting copies, allocations and calls
minutes: 14
---
Performance reasoning in C++ starts long before a stopwatch: it starts by naming the operations a line of code performs and counting them. A `std::vector<int>` passed by value is an allocation plus a copy of every element; a `std::string` longer than fifteen characters is an allocation; `s = s + piece` in a loop copies the whole prefix every time. None of those costs is visible in the source, and all of them are predictable from the value semantics the earlier modules taught. This lesson builds the model — what a copy, an allocation and a call cost relative to each other — and applies it to the decisions that recur in every program: how to pass, how to return, when to `reserve`, how to build a string, and when a view beats a copy.

## What a copy is made of

Copying a value means copying its bytes and, for anything that owns memory, allocating and copying what it owns:

| Value | The copy is |
| --- | --- |
| `int`, `double`, a small `struct` of them | a register move; effectively free |
| `std::string` of ≤ 15 characters (libstdc++'s small-string buffer) | a copy of the handle's bytes; no allocation |
| `std::string` of 100 characters | one allocation plus 100 bytes copied |
| `std::vector<int>` of a million | one allocation plus four megabytes copied |
| `std::vector<std::string>` | one allocation, then *one copy per element* — each with its own rule above |

A `std::vector` handle is three pointers; copying the handle is not the cost, copying the elements is. The `std::string` boundary — fifteen characters on this platform's libstdc++, twenty-two on libc++ — is why "small strings are cheap" is true and "strings are cheap" is not.

## Orders of magnitude

The relative costs below are from published measurements of ordinary hardware; the absolute numbers vary by machine, the *ratios* do not:

| Operation | Roughly |
| --- | --- |
| Integer add, compare, correctly predicted branch | under 1 ns |
| Read from L1 cache | ~1 ns |
| Read from main memory (a cache miss) | ~100 ns |
| Small allocation and free (`new`/`delete` pair) | ~20–50 ns |
| Mispredicted branch | ~5–7 ns |
| A system call | ~200 ns and up |

An allocation costs about as much as fifty arithmetic operations, so a loop that allocates per iteration is an allocation loop whatever else it does; a cache miss costs about a hundred, which lesson 3 is about.

## Passing parameters

Module 4 gave the rule; the model explains it. Passing by value copies; passing by `const&` binds a name to the caller's object for the price of one pointer:

```cpp
long long total(const std::vector<int>& v);   // no copy, cannot modify
long long total(std::vector<int> v);          // allocation + n copies per call
```

By value is right for small trivially copyable types (`int`, `double`, a `Point` of two doubles, `std::string_view`, `std::span`), where a copy is a register move and the indirection of a reference would cost more. It is also right for a **sink** — a parameter the function will store — because the caller can then move into it:

```cpp
void Log::add(std::string line) { lines_.push_back(std::move(line)); }

log.add(text);              // one copy (into the parameter), one move (into the vector)
log.add(std::move(text));   // one move, one move
log.add("literal");         // constructs in place: zero copies, one move
```

The instrumented type in this lesson's exercise counts exactly these: an lvalue argument to a by-value parameter is one copy, `std::move` of it is one move, a `const&` parameter is neither, and a temporary passed by value is *nothing* — C++17 guarantees the parameter is constructed directly from the prvalue (Module 9, lesson 5).

## Returning

Return by value. A prvalue return (`return std::vector<int>{…}`) is elided by rule; a named local (`return result;`) is elided by every compiler through NRVO, and moved when it cannot be. `return std::move(result);` disables NRVO and *forces* the move — a pessimisation. Output parameters (`void fill(std::vector<int>& out)`) save nothing over returning and cost the caller a declaration.

## Growth and `reserve`

A `std::vector` that outgrows its capacity allocates a bigger block, moves every element across and frees the old one. With a growth factor *f* the total number of element moves over *n* pushes is bounded by *n · f / (f − 1)* — twice *n* for doubling — so the amortised cost per `push_back` is constant. For a doubling vector filled from empty:

| Pushes | Allocations | Elements moved | Final capacity |
| --- | --- | --- | --- |
| 10 | 5 | 15 | 16 |
| 100 | 8 | 127 | 128 |
| 1 000 | 11 | 1 023 | 1 024 |

`reserve(n)` first turns that into one allocation and zero moves. It is the single most common cheap win in C++ code: whenever the final size is known or bounded, reserve. The factor and the exact capacities are implementation choices — libstdc++ doubles, MSVC grows by 1.5 — which is why the exercise models its own `Vec` with a stated factor rather than reading `capacity()`.

`emplace_back(args…)` constructs the element in place from its arguments; `push_back(x)` copies an lvalue and moves an rvalue. For a `std::vector<std::string>`, `v.push_back(s)` is an allocation and a copy of the characters, `v.push_back(std::move(s))` is a pointer swap, `v.emplace_back("text")` constructs once.

## Building strings

```cpp
std::string out;
for (const auto& piece : pieces) out += piece;          // amortised linear
for (const auto& piece : pieces) out = out + piece;     // quadratic
```

`out += piece` appends into spare capacity, reallocating geometrically like a vector, so *k* pieces of *m* characters copy about *k·m* bytes in total. `out = out + piece` builds a fresh temporary containing everything so far plus the piece, then moves it into `out`: the *i*-th iteration copies *i·m* bytes, and the total is *m · k(k + 1) / 2*. For a thousand ten-character pieces that is ten kilobytes copied against five megabytes — the same output, five hundred times the work. `std::ostringstream` and `std::format` are also linear; `reserve` on the string removes the growth copies too.

## Views instead of copies

`std::string::substr` allocates a new string for anything past the small buffer; `std::string_view::substr` adjusts a pointer and a length. A parser that slices its input with views does zero allocations for the slicing itself, which is the whole case for `std::string_view` (Module 5, lesson 6) — with the standing rule that the view must not outlive the string it looks into.

## The method

For any line you suspect: name the operation (copy, allocation, comparison, call), count how often it runs per element, multiply by the elements, compare with the alternative. The model is coarse — it ignores caches, branch prediction and what the optimiser removes — but it ranks alternatives correctly far more often than intuition does, and it is the form every exercise in this module takes: a counter that reports what the code did, never a clock.

## Pitfalls

| Written | Cost you did not see |
| --- | --- |
| `void f(std::vector<int> v)` for read-only `v` | An allocation and *n* copies per call |
| `for (auto s : names)` over strings | One copy per element (Module 3, lesson 4) |
| `push_back` a million times without `reserve` | ~20 reallocations and ~a million element moves |
| `out = out + piece` in a loop | Quadratic copying |
| `return std::move(local);` | Forces a move where elision was free |
| `std::string key = line.substr(a, b)` in a hot loop | One allocation per slice; a `string_view` is none |

## Key takeaways

- A copy of an owning type is an allocation plus a copy of what it owns; small strings and small structs are the cheap exceptions.
- An allocation costs about fifty arithmetic operations; a cache miss about a hundred. Loops are judged by what they allocate and touch.
- Pass by `const&` to read, by value to sink or for small types, and move into sinks; return by value and never `return std::move(local)`.
- `reserve` when the size is known; geometric growth keeps `push_back` amortised constant, but the moves are real.
- `+=` builds a string in linear time; `s = s + piece` is quadratic; views slice without allocating.
