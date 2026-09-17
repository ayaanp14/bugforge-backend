---
title: Subscript, call and function objects
minutes: 15
---
Two operators turn a class into something that *behaves like* a container or a function. `operator[]` makes `grid[r]` and `table["key"]` possible and is why `std::vector` and `std::map` read like arrays; `operator()` makes an object callable, and an object that can be called — a *function object*, or functor — is what `std::sort`, `std::priority_queue`, `std::map` and `std::unordered_map` accept wherever they need a comparison or a hash. This lesson settles the const/non-const pair every `operator[]` needs, bounds checking, `operator()` for both multi-index access and callable state, comparators as types, and the `std::hash` specialisation that lets your own struct be a hashed key.

## operator[] — always two of them

```cpp
#include <vector>
#include <stdexcept>

class Row {
public:
    explicit Row(std::size_t n) : data_(n) {}
    long long& operator[](std::size_t i) { return data_[i]; }               // for a non-const Row: can be assigned to
    const long long& operator[](std::size_t i) const { return data_[i]; }   // for a const Row: read only
    long long& at(std::size_t i) {
        if (i >= data_.size()) throw std::out_of_range("Row::at");
        return data_[i];
    }
private:
    std::vector<long long> data_;
};

Row r(3);
r[0] = 7;                       // non-const overload: returns a reference, so assignment works
const Row& view = r;
long long v = view[0];          // const overload
```

`operator[]` must be a member and takes exactly one parameter in C++20. It returns a **reference** to the element — by value, `r[0] = 7` would assign to a temporary and change nothing — and it comes in two overloads, because a `const Row&` parameter (the way every function should receive a container it only reads) can call only `const` member functions. Forget the const overload and `sum(const Row&)` fails to compile at the first `r[i]`. The non-const one returns `T&`, the const one `const T&`; the compiler picks by the constness of the object. Follow `std::vector`: `[]` does not check the index (undefined behaviour out of range, Module 6), and a checked `at()` throws `std::out_of_range`. A negative literal index converts to a huge `std::size_t` and hits the check, which is one reason to prefer `at()` while developing.

## Two dimensions: operator() and a row view

Until C++23, `operator[]` takes one argument, so `m[r, c]` is not available on this track's C++20 runtime — the comma there is the comma operator, evaluating to `c`. The idiom for a matrix is `operator()(r, c)`, which takes any number of parameters:

```cpp
#include <span>

class Matrix {
public:
    Matrix(std::size_t rows, std::size_t cols) : rows_(rows), cols_(cols), data_(rows * cols) {}
    long long& operator()(std::size_t r, std::size_t c) { return data_[r * cols_ + c]; }
    const long long& operator()(std::size_t r, std::size_t c) const { return data_[r * cols_ + c]; }
    std::span<long long> operator[](std::size_t r) { return {data_.data() + r * cols_, cols_}; }
    std::span<const long long> operator[](std::size_t r) const { return {data_.data() + r * cols_, cols_}; }
private:
    std::size_t rows_, cols_;
    std::vector<long long> data_;   // one contiguous block, row-major
};

Matrix m(2, 3);
m(1, 2) = 5;                        // element access
for (long long x : m[1]) { /* the second row, as a view */ }
```

The elements live in one `std::vector` (row-major, `r * cols + c`), which is faster and simpler than a vector of vectors. `operator[](r)` returns a `std::span` over that row — a non-owning view (Module 16) — so `m[1][2]` works through the span's own `[]`, and range-for over a row needs no copy. Both operators again come in const and non-const pairs.

## operator() and function objects

```cpp
class RunningMean {
public:
    double operator()(double x) {           // callable: mean(x)
        sum_ += x;
        return sum_ / ++count_;
    }
private:
    double sum_ = 0;
    int count_ = 0;
};

RunningMean mean;
mean(10.0);          // 10
mean(20.0);          // 15
```

Any class with an `operator()` is a *function object*: it is called with the usual syntax and it carries state between calls, which a plain function cannot. A lambda (Module 4, lesson 5) is exactly this — the compiler generates a class whose captures are members and whose body is `operator()` — which is why a lambda and a hand-written functor are interchangeable in every algorithm. Write the class when the callable needs a name, several members, or a type you can spell in a template argument; write the lambda otherwise.

## Functors as comparators

```cpp
#include <algorithm>
#include <queue>
#include <set>

struct ByPriority {
    bool operator()(const Task& a, const Task& b) const {          // "a is worse than b"
        if (a.priority != b.priority) return a.priority < b.priority;
        return a.seq > b.seq;                                       // earlier arrival wins a tie
    }
};

std::priority_queue<Task, std::vector<Task>, ByPriority> queue;   // top() is the best task by ByPriority
std::sort(tasks.begin(), tasks.end(), ByPriority{});               // ascending by the same rule
std::set<Task, ByPriority> ordered;                                // ordered by the same rule
std::map<std::string, int, std::greater<>> byNameDesc;             // a library functor: descending keys
```

A comparator is a callable returning `true` when its first argument sorts *before* its second — the strict weak ordering from lesson 2. `std::sort` takes it as a value; the containers take it as a **type** parameter, which is why a comparator that lives in a template argument must be a class (a lambda's type has no name you can write, short of `decltype`). Two rules: the ordering must be strict (`<`, never `<=`), and `operator()` must be `const` — `std::set` calls it on a const comparator and libstdc++ stops compilation with "comparison object must be invocable as const" otherwise. `std::priority_queue` inverts the intuition: with `std::less` the *largest* element is on top, so `std::greater<T>` gives a min-heap, and a custom comparator should say "a is lower priority than b". Ties need a deterministic tie-breaker (a sequence number) whenever output order matters.

## std::hash for your own key

`std::unordered_map<Point, int>` needs two things a plain struct lacks: an `operator==` and a hash. The hash is a specialisation of `std::hash` — a functor type with a `const noexcept` call operator taking the key and returning `std::size_t`:

```cpp
#include <functional>
#include <unordered_map>

struct Point {
    int x, y;
    bool operator==(const Point&) const = default;
};

template <>
struct std::hash<Point> {
    std::size_t operator()(const Point& p) const noexcept {
        const std::size_t h1 = std::hash<int>{}(p.x);
        const std::size_t h2 = std::hash<int>{}(p.y);
        return h1 ^ (h2 + 0x9e3779b9 + (h1 << 6) + (h1 >> 2));   // combine, not just XOR
    }
};

std::unordered_map<Point, int> visits;
++visits[Point{1, 2}];
```

Combine member hashes rather than XOR-ing them: `h1 ^ h2` makes `(1, 2)` and `(2, 1)` collide, and any point with `x == y` hashes to zero. The two members must agree — equal keys hash equal — and both must ignore the same fields. An alternative to specialising is passing a hasher type as the third template argument, `std::unordered_map<Point, int, PointHash>`, which is the choice when the key type is not yours to specialise for. Whatever the hash, iteration order of an unordered container is unspecified and differs between libraries: copy the entries into a `std::vector` and `std::sort` them before printing anything a test compares. `std::string`, `std::string_view`, the integers, pointers, `std::optional` and `std::variant` already have a `std::hash`; `std::pair` and `std::tuple` do not, which is the usual reason a `PointHash` exists.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Only a non-const `operator[]` | A `const T&` parameter cannot be indexed |
| `operator[]` returning by value | `r[i] = x` assigns to a temporary |
| `m[r, c]` in C++20 | The comma operator: `m[c]` |
| Comparator `operator()` not `const` | Static assertion in `std::set`/`std::map` |
| Comparator using `<=` | Not a strict weak ordering: UB in `std::sort` |
| Printing an `unordered_map` in iteration order | Unspecified order; sort first |
| `std::hash` that ignores a member `==` uses | Equal keys in different buckets: lookups miss |
| `h1 ^ h2` as the combined hash | Symmetric collisions; `(a, a)` always hashes to 0 |

## Key takeaways

- `operator[]` is a member, returns a reference and needs both a const and a non-const overload; `[]` is unchecked, `at()` throws.
- Use `operator()(r, c)` for two-dimensional access in C++20 and a `std::span` row view for `m[r][c]`.
- A class with `operator()` is a function object; a lambda is one the compiler wrote.
- Comparators are strict-weak-ordering functors with a `const` call operator; containers take them as a type, `std::priority_queue` puts the "largest" on top.
- `template <> struct std::hash<Key>` plus `operator==` makes a struct an `unordered_map` key; combine member hashes, keep `==` and hash consistent, and sort before printing.
