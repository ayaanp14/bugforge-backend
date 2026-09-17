---
title: Range-based for — iterating without indices
minutes: 13
---
Most loops over a container do not need an index; they need each element in turn. The range-based `for`, added in C++11, says exactly that — `for (element : container)` — and removes the three places an index loop can be wrong: the start, the bound and the subscript. What it does not remove is the question of *how* each element is handed to you: by copy, by reference or by const reference, spelled `auto`, `auto&` and `const auto&`. Choosing wrongly is silent — a loop that modifies copies compiles and does nothing. This lesson covers what the loop expands to, the three declarations and when each is right, structured bindings over a `std::map`, when an index loop is still the answer, and why a container must not change while it is being iterated.

## The form and what it expands to

```cpp
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> names{"ada", "bob", "cy"};
    for (const std::string& name : names) {
        std::cout << name << '\n';
    }
    for (char c : std::string{"abc"}) std::cout << c << ' ';
    for (int x : {10, 20, 30}) std::cout << x << ' ';
    int fib[] = {1, 1, 2, 3, 5};
    for (int f : fib) std::cout << f << ' ';
    std::cout << '\n';
    return 0;
}
```

The compiler rewrites `for (decl : range) body` into roughly:

```cpp
{
    auto&& __range = range;
    auto __begin = std::begin(__range);
    auto __end = std::end(__range);
    for (; __begin != __end; ++__begin) {
        decl = *__begin;
        body
    }
}
```

Three consequences follow. Anything with `begin()` and `end()` works: every standard container, `std::string`, a built-in array whose size the compiler knows, an initialiser list, a `std::string_view`. The end is computed once, before the first iteration. And `decl` is initialised from `*__begin` each time — which is where the copy question comes from.

## auto, auto& and const auto&

```cpp
std::vector<std::string> words{"one", "two"};

for (auto w : words) w += "!";                 // w is a copy; words is unchanged
for (auto& w : words) w += "!";                // w refers to the element; words is modified
for (const auto& w : words) std::cout << w;    // read-only, no copy
```

| Declaration | Meaning | Use when |
| --- | --- | --- |
| `auto x` | copy of each element | the element is small (`int`, `char`, a pointer) or you want a copy to alter |
| `auto& x` | reference to the element | modifying in place |
| `const auto& x` | read-only reference | reading anything bigger than a register — strings, vectors, structs |

The first line above is the trap: it compiles, runs, and leaves `words` as it was, because each `w` is a fresh `std::string` destroyed at the end of its iteration. There is no warning. The reverse mistake, `auto` where `const auto&` was meant, is invisible too and merely slow — a loop over a `std::vector<std::string>` with `auto` copies every string. The rule that avoids both: `const auto&` by default, `auto&` to modify, plain `auto` only for small types. Writing the type instead of `auto` (`const std::string&`, `char&`) is equally correct and often clearer.

```cpp
std::string s = "hello";
for (char& c : s) {
    c = static_cast<char>(std::toupper(static_cast<unsigned char>(c)));
}
```

`<cctype>` functions take and return `int`, and the `unsigned char` cast is the correct way to hand them a `char` (Module 5, lesson 3).

## A map, in order, with structured bindings

A `std::map<K, V>` iterates in key order — that is what makes it a map and not an `unordered_map` — and each element is a `std::pair<const K, V>`. C++17 structured bindings unpack it in the declaration:

```cpp
std::map<std::string, int> freq{{"pear", 2}, {"apple", 5}, {"fig", 1}};
for (const auto& [word, count] : freq) {
    std::cout << word << ' ' << count << '\n';   // apple 5, fig 1, pear 2
}
for (auto& [word, count] : freq) count *= 2;     // values are modifiable; keys are const
```

The key is `const` in the pair because changing it would break the tree's ordering; `auto&` therefore gives a mutable `count` and an immutable `word`. `auto [k, v]` without the reference copies every pair. Before C++17 the same loop read `entry.first` and `entry.second`. Sorted output for free is the reason the frequency-count exercise uses `std::map`: an `unordered_map` would have to be copied into a vector and sorted first, because its iteration order is unspecified and differs between runs and library versions.

## When an index is still the answer

Range-for gives you elements, not positions. Reach for an index loop when the body needs:

- the position itself — `std::cout << i << ": " << v[i]`;
- a neighbour — `v[i] == v[i - 1]` for runs, or `v[i] < v[i + 1]` for "is sorted";
- two ranges in lockstep — `a[i] * b[i]` for a dot product;
- a direction or stride — backwards, every second element, from index 3;
- to stop early at a position you then use after the loop.

A counter declared beside a range-for (`std::size_t i = 0; for (const auto& x : v) { /* … */ ++i; }`) is a legitimate middle ground when only the position is missing. C++20 `std::views::reverse` (`for (int x : v | std::views::reverse)`) covers "backwards"; `std::views::enumerate` is C++23 and not available on this track's runtime — Module 14 covers views.

## Do not modify the container you are iterating

```cpp
std::vector<int> v{1, 2, 3};
for (int x : v) {
    if (x == 2) v.push_back(4);   // undefined behaviour
}
```

The loop holds `__begin` and `__end` from before the first iteration. `push_back` may reallocate the vector's storage, after which both point into freed memory; even without reallocation, `__end` still points at the old end. `erase` is the same story with iterators that now skip or repeat. The rule: a range-for reads a container whose *size does not change* in the body. To build a filtered or extended result, write into a second container; to delete while walking, use explicit iterators and the `it = v.erase(it)` idiom (Module 13, lesson 6). Modifying the *elements* through `auto&` is fine — the container's shape is what must hold still.

## What goes wrong

| Mistake | What happens |
| --- | --- |
| `for (auto s : strings) s += "x";` | Alters copies; the container is unchanged, no warning. |
| `for (auto s : strings) read(s);` | Correct, and copies every string. Use `const auto&`. |
| `for (auto& x : {1, 2, 3}) x *= 2;` | Compile error: the elements of an initialiser list are `const`. |
| `for (auto [k, v] : m)` | Copies every pair; `const auto&` reads, `auto&` modifies `v`. |
| `for (int x : longLongs)` | Narrows each element silently; use `auto` or the right type. |
| `push_back`/`erase` inside the loop | Invalidated iterators: undefined behaviour. |
| `for (auto x : make().items())` | If `items()` returns a reference, the temporary `make()` is gone before the loop runs (C++23 fixes this); bind `make()` to a variable first. |

## Key takeaways

- `for (decl : range)` walks `begin()` to `end()`, computing the end once and initialising `decl` from each element.
- `const auto&` to read, `auto&` to modify, `auto` only for small types — the copy trap is silent.
- A `std::map` iterates in key order; `const auto& [key, value]` unpacks each entry, and the key is always `const`.
- When the body needs a position, a neighbour or two ranges at once, use an index loop.
- Never grow or shrink the container inside its own range-for.
