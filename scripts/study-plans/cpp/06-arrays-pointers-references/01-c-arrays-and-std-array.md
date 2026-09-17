---
title: Built-in arrays and std::array
minutes: 14
---
An array is a fixed number of elements of one type stored one after another in memory. C++ inherited the built-in array from C, and with it three properties that shape the whole language: the size is fixed at compile time, nothing checks that an index is in range, and the array's name quietly turns into a pointer the moment you pass it around. This lesson settles what a built-in array really is, where it bites, and why `std::array<T, N>` — the same contiguous block with value semantics and a `.size()` — is what modern code writes instead.

## Declaring and initialising

```cpp
int scores[5];                    // five ints; automatic storage, NOT initialised
int primes[5] = {2, 3, 5, 7, 11}; // aggregate initialisation
int zeros[5] = {};                // every element value-initialised to 0
int partial[5] = {1, 2};          // 1, 2, 0, 0, 0 — the rest are zeroed
int deduced[] = {4, 8, 15, 16};   // size deduced from the initialiser: 4
```

The size in brackets must be a constant expression: a literal, a `constexpr int`, an enumerator. `int n; std::cin >> n; int a[n];` is a *variable-length array* — a C99 feature that GCC accepts as an extension and standard C++ does not have; Clang warns and other compilers reject it. When the size is only known at run time the answer is `std::vector` (Module 13, STL containers).

The first line above is the dangerous one: a local built-in array with no initialiser holds whatever bytes were on the stack, and reading them is undefined behaviour. `int scores[5] = {};` costs nothing; write the braces every time.

## Indexing, and what the language does not check

```cpp
int a[4] = {10, 20, 30, 40};
std::cout << a[0] << ' ' << a[3] << '\n';   // 10 40
a[4] = 50;                                    // undefined behaviour: there is no a[4]
```

Indices run from `0` to `N - 1`. There is no check: `a[4]` writes four bytes past the end of `a` into whatever happens to be there — another local, the return address, nothing you can predict — and under `-O2` the optimiser is entitled to assume it never happens and delete code around it. The array does not know its own end. You have to.

To ask an array its element count, use `std::size` from `<iterator>` (C++17). It works only while the name still denotes an array, which turns out to be a feature:

```cpp
#include <iterator>
int a[4] = {10, 20, 30, 40};
for (std::size_t i = 0; i < std::size(a); ++i) std::cout << a[i] << ' ';
for (int x : a) std::cout << x << ' ';        // range-for knows the bounds too
```

The older `sizeof a / sizeof a[0]` gives the same number, and a silent wrong answer after decay; prefer `std::size`.

## Decay: the array is not a value

A built-in array is not a first-class value. It cannot be assigned (`b = a;` is a compile error), cannot be returned from a function by value, and cannot be compared with `==`. Worse, in almost every expression the array's name **decays** into a pointer to its first element:

```cpp
void show(int values[], int n) {          // exactly the same as void show(int* values, int n)
    std::cout << sizeof values << '\n';   // 8 on this platform — the size of a pointer, not of the array
}

int a[4] = {1, 2, 3, 4};
show(a, 4);                               // a decays to &a[0]; the 4 has to travel separately
```

`int values[]` and `int values[4]` in a parameter list are both just `int*` — the number is ignored. That is why every C-style function that takes an array also takes a length, and why `std::size(values)` inside `show` is a compile error rather than a wrong answer: a pointer has no size to give.

Comparing two arrays with `==` compiles because both decay: it compares two addresses and is always `false` for distinct arrays (C++20 deprecates it and `-Wall` warns). If the size must survive a call, pass the array by reference — `void show(const int (&values)[4])` — or, better, stop using built-in arrays for anything you pass around.

## std::array<T, N>: the same block, done properly

```cpp
#include <array>

std::array<int, 5> a{2, 3, 5, 7, 11};
std::array<int, 5> z{};                  // all zeros
std::cout << a.size() << ' ' << a[2] << ' ' << a.front() << ' ' << a.back() << '\n';   // 5 5 2 11
a.at(2) = 6;                             // bounds-checked: at(7) throws std::out_of_range
a.fill(0);                               // every element 0

std::array<int, 5> b = a;                // a real copy — value semantics
b[0] = 99;                               // a[0] is unchanged
bool same = (a == b);                    // element-wise comparison: false
```

`std::array` is a struct wrapping one built-in array: the same layout, the same zero overhead, the same fixed size — and it fixes everything above. It is copied and assigned like an `int`, compared element by element, passed by (const) reference without losing its size, and returned by value. `.at()` gives a checked access when the index came from outside; `[]` is still unchecked, exactly as fast as the built-in and exactly as undefined out of range.

```cpp
double mean(const std::array<int, 5>& values) {   // by const reference: no copy, size known
    long long sum = 0;
    for (int x : values) sum += x;
    return static_cast<double>(sum) / values.size();
}
```

The one thing `std::array` shares with the built-in is uninitialised elements when you write `std::array<int, 5> a;` with no braces. Write `a{}`.

| | Built-in `T a[N]` | `std::array<T, N>` | `std::vector<T>` |
| --- | --- | --- | --- |
| Size | compile-time, fixed | compile-time, fixed | run-time, growable |
| Knows its size | only via `std::size`, before decay | `.size()` | `.size()` |
| Copy, assign, `==` | no (decays) | yes, element-wise | yes, element-wise |
| Bounds check | none | `.at()` | `.at()` |
| Storage | inline (the stack, for a local) | inline | the heap, through a handle |

## Two-dimensional built-in arrays, in brief

```cpp
int grid[3][4] = {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}};
std::cout << grid[1][2] << '\n';   // 7: row 1, column 2
```

A 2-D built-in array is an array of arrays, laid out row after row in one block (row-major). Passing one to a function needs every dimension but the first — `void show(int g[][4], int rows)` — so the compiler can compute `g[r][c]`. Lesson 6 covers grids properly.

## Pitfalls

- **Off by one.** `for (int i = 0; i <= N; ++i) a[i]` touches `a[N]`. Half-open ranges (`i < N`) are the habit that prevents it.
- **`sizeof` after decay.** `sizeof values / sizeof values[0]` inside a function taking `int values[]` is `8 / 4 = 2`, always. Pass the length or use `std::array`.
- **Uninitialised elements.** `int a[5];` and `std::array<int, 5> a;` both hold garbage. `= {}` and `{}`.
- **Returning a local array.** `int* f() { int a[3] = {1, 2, 3}; return a; }` returns a pointer to storage that no longer exists — a dangling pointer (lesson 4 and Module 7, Memory, ownership and RAII).

## Key takeaways

- A built-in array is a fixed-size contiguous block with no bounds check; out-of-range access is undefined behaviour, not an exception.
- Always initialise: `int a[N] = {};`.
- An array's name decays to a pointer to its first element when passed; the callee loses the size, so pass it separately.
- `std::array<T, N>` keeps the layout and the speed and adds value semantics, `.size()`, `.at()` and `==`.
- Fixed size at compile time: `std::array`. Run-time size: `std::vector`. A raw `T a[N]` only for the smallest local scratch.
