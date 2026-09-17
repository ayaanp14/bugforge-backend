---
title: std::vector in depth — size, capacity and the erase–remove idiom
minutes: 14
---
`std::vector` is the container you will use in nine programs out of ten, and almost everything that goes wrong with it comes from one fact: its elements live in a single contiguous block that is occasionally thrown away and replaced by a bigger one. That fact explains why `push_back` is fast on average but not always, why a reference into a vector can silently die, why `reserve` exists, and why the idiomatic way to delete several elements is an algorithm rather than a loop. This lesson covers the size–capacity model, the growth rule, `emplace_back`, `insert`/`erase`, the erase–remove idiom and its C++20 replacement `std::erase_if`, the odd `std::vector<bool>`, `data()` and two-dimensional vectors.

## Size and capacity

A vector holds three pointers: the start of its block, one past the last element (`size()`) and one past the block (`capacity()`). `size()` is how many elements exist; `capacity()` is how many fit before the block must be replaced.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v;
    std::cout << v.size() << '\n';           // 0
    v.reserve(100);                          // one allocation, no elements
    std::cout << v.size() << ' ' << (v.capacity() >= 100) << '\n';   // 0 1
    for (int i = 0; i < 100; ++i) v.push_back(i);   // no reallocation happens
    v.resize(3);                             // destroys 97 elements; capacity is kept
    v.clear();                               // destroys the rest; capacity is still kept
    std::cout << v.size() << ' ' << v.empty() << '\n';   // 0 1
    v.shrink_to_fit();                       // a request to release the block; not binding
    return 0;
}
```

`resize(n)` changes the size — destroying elements or value-initialising new ones (`resize(n, x)` fills with `x`) — and `reserve(n)` changes only the capacity. Neither shrinks the block: `clear()` leaves the capacity in place so the vector can be refilled without reallocating. The exact capacity after growth is unspecified by the standard, so a program must never print or compare it beyond `capacity() >= n` right after a `reserve(n)`; a judged program prints `size()`.

## The growth rule and amortised push_back

When `push_back` finds `size() == capacity()` it allocates a bigger block, moves (or copies, Module 9) every element across, destroys the old ones and frees the old block. libstdc++ doubles the capacity; MSVC multiplies by 1.5. Because the block grows geometrically, a sequence of n pushes performs O(n) element moves in total — each element is moved at most a constant number of times — so `push_back` is **amortised O(1)**: cheap on average, with an occasional expensive call.

`reserve(n)` before a loop of known length turns that occasional call into none. It avoids the moves, and — more importantly — the **invalidation**: a reallocation moves every element to a new address, so every pointer, reference and iterator into the old block is now dangling.

```cpp
std::vector<int> v{1, 2, 3};
int& first = v.front();
v.push_back(4);            // may reallocate
std::cout << first;        // undefined behaviour if it did
```

The rule: never keep a reference or iterator into a vector across a `push_back`, `insert` or `resize` unless you reserved enough beforehand. Store an index instead — `v[0]` is recomputed from the current block every time.

## push_back, emplace_back and the element type

`push_back(x)` copies or moves an existing object into the block. `emplace_back(args...)` constructs the element *in place* from constructor arguments, saving the temporary:

```cpp
std::vector<std::string> words;
words.push_back("alpha");               // constructs a temporary std::string, then moves it
words.emplace_back("beta");             // constructs the std::string directly in the block
words.emplace_back(3, 'x');             // std::string(3, 'x') → "xxx"
words.push_back(std::move(existing));   // moves; existing is left valid but unspecified
```

Both are amortised O(1). `emplace_back` returns a reference to the new element since C++17, so `auto& w = words.emplace_back("gamma");` is legal — and dies at the next reallocation like any other reference.

## insert and erase in the middle

`v.insert(pos, x)` shifts every element from `pos` to the end one place right, and `v.erase(pos)` shifts them one place left, so both are O(n) in the distance to the end. Both take an iterator, and `v.begin() + i` is how an index becomes one (random access makes that O(1)):

```cpp
std::vector<int> v{10, 20, 30};
v.insert(v.begin() + 1, 15);        // 10 15 20 30
v.erase(v.begin());                 // 15 20 30
v.erase(v.begin() + 1, v.end());    // 15 — a half-open range
v.pop_back();                       // empty; pop_back on an empty vector is undefined behaviour
```

`erase` returns an iterator to the element after the one removed, which is the basis of the erase-while-iterating idiom in lesson 6. For inserting at the front repeatedly, a vector is the wrong container — every insert shifts everything — and `std::deque` is the answer (lesson 3).

## Removing several elements: erase–remove and std::erase_if

Erasing one element at a time inside a loop is O(n²) — each `erase` shifts the tail — and the loop is easy to get wrong. The classic solution is two steps. `std::remove_if` (or `std::remove` for a value) walks the range once, copying the elements to keep towards the front, and returns an iterator to the new logical end; the elements from there on are left in a valid but unspecified state. `erase` then chops that tail:

```cpp
#include <algorithm>
#include <vector>

std::vector<int> v{1, 2, 3, 4, 5, 6};
v.erase(std::remove_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; }), v.end());
// v is 1 3 5
```

This is the **erase–remove idiom**, a single O(n) pass. It survives in a great deal of code and interviewers still ask for it, but since C++20 the standard spells it for you:

```cpp
std::erase_if(v, [](int x) { return x % 2 == 0; });   // same effect, returns the count removed
std::erase(v, 3);                                       // remove every 3
```

`std::erase_if` exists for every standard container — `std::vector`, `std::deque`, `std::list`, `std::string`, `std::set`, `std::map` and the unordered ones — and returns how many elements went. Prefer it; the idiom is for code that predates C++20 or a range that is not a whole container. When the predicate needs state, such as a `std::set` of values already seen, capture it by reference so that a copy of the lambda shares it.

## std::vector<bool> is not a vector of bool

`std::vector<bool>` is a specialisation that packs eight elements per byte. The saving is real, but it breaks the container contract: `v[i]` returns a proxy object rather than a `bool&`, so `auto b = v[0];` is not a `bool`, `bool& r = v[0];` does not compile, there is no `data()`, and threads writing neighbouring elements race. For flags with normal semantics use `std::vector<char>` or `std::deque<bool>`; for packed bits of a fixed size, `std::bitset<N>`.

## data() and the contiguity guarantee

Because the elements are contiguous, `v.data()` is a `T*` to the first one and `v.data() + v.size()` is one past the last — the same `[begin, end)` pointer pair a C API or a built-in array uses (Module 6, lesson 3), and what `std::span<int>` (Module 16) wraps without owning. Contiguity is also why a plain index loop is as fast as it is: the next element is always in the same or the next cache line.

## Two-dimensional vectors

A grid is a vector of vectors, sized in one expression: `std::vector<std::vector<int>> g(rows, std::vector<int>(cols, 0));`. Each row is its own block, so `g[r][c]` costs two indirections and rows may differ in length (a jagged array). For a grid indexed hot in a loop, a single `std::vector<int> flat(rows * cols)` indexed as `flat[r * cols + c]` keeps everything contiguous (Module 6, lesson 6). `std::vector<std::vector<int>> g(rows);` followed by `g[r][c] = x` is out of bounds — the inner vectors are empty until sized.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Keeping `int& r = v[i]` or an iterator across `push_back` | Dangling after a reallocation; undefined behaviour |
| `v[v.size()]` or `v[i]` with `i` past the end | No bounds check; undefined behaviour — `v.at(i)` throws `std::out_of_range` |
| `for (…) v.erase(v.begin() + i);` to remove several | O(n²) and skips the element after each erase |
| `std::remove_if(…)` without the `erase` | The vector keeps its old size; the tail holds leftovers |
| Printing `capacity()` | Implementation-specific numbers; print `size()` |
| Treating `std::vector<bool>` as a `std::vector` | Proxy elements, no `data()`, no `bool&` |
| `std::vector<int> v(10, 1)` vs `std::vector<int> v{10, 1}` | Ten ones vs the two elements 10 and 1 — braces prefer the initialiser list |

## Key takeaways

- A vector is one contiguous block; `size()` is what is used, `capacity()` is what is allocated, and growth is geometric so `push_back` is amortised O(1).
- Reallocation invalidates every pointer, reference and iterator into the vector; `reserve` ahead or hold indices.
- `emplace_back` constructs in place from constructor arguments; `insert`/`erase` in the middle are O(n) and take iterators (`v.begin() + i`).
- Delete several elements with `std::erase_if(v, pred)` (C++20) or the erase–remove idiom, never one `erase` per element in a loop.
- `std::vector<bool>` is a packed proxy type; `data()` gives the `[begin, end)` pointer pair; a 2-D vector is sized as `g(rows, std::vector<int>(cols))`.
