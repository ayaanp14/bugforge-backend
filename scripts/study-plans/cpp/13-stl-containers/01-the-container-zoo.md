---
title: The container zoo — choosing a container
minutes: 12
---
The STL ships about a dozen containers and most programs use two of them, `std::vector` and a map. The rest earn their place in specific situations, and the skill this lesson settles is naming those situations: which family a container belongs to, what its operations cost, which member functions every container shares, and the one-sentence reason for reaching past `std::vector`. Every container is a class template (Module 12) that owns its elements by value, so the choice is about where the elements sit in memory and what that layout makes cheap.

## Four families

**Sequence containers** keep elements in the order you put them. `std::vector` is one contiguous block that grows at the back; `std::deque` is a chain of fixed-size blocks that grows at both ends; `std::list` is a doubly linked chain of nodes; `std::forward_list` is singly linked; `std::array` (Module 6) never grows.

**Associative containers** keep elements sorted by key inside a balanced binary tree: `std::set` holds keys, `std::map` holds key–value pairs, and `std::multiset`/`std::multimap` allow duplicate keys.

**Unordered containers** keep elements in a hash table: `std::unordered_set`, `std::unordered_map` and their `multi` versions. Lookup is average O(1); the price is that iteration visits elements in no useful order.

**Container adaptors** wrap a sequence container and expose a narrower interface: `std::stack` (last in, first out), `std::queue` (first in, first out) and `std::priority_queue` (largest out first). They have no iterators.

| Container | Header | Layout | Order |
| --- | --- | --- | --- |
| `std::vector<T>` | `<vector>` | one contiguous block | insertion |
| `std::deque<T>` | `<deque>` | blocks, both ends grow | insertion |
| `std::list<T>` | `<list>` | doubly linked nodes | insertion |
| `std::set<K>` / `std::map<K, V>` | `<set>` / `<map>` | red–black tree | sorted by key |
| `std::unordered_set<K>` / `std::unordered_map<K, V>` | `<unordered_set>` / `<unordered_map>` | hash buckets | unspecified |
| `std::stack`, `std::queue`, `std::priority_queue` | `<stack>`, `<queue>` | wrap a `deque` or `vector` | push/pop only |

## The complexity table

An interview question about containers is almost always a question about this table. Learn it as a picture of the layouts: contiguous memory makes indexing free and middle insertion expensive; linked nodes make the reverse true; a tree makes everything logarithmic; a hash table makes lookup constant on average.

| Operation | `vector` | `deque` | `list` | `set`/`map` | `unordered_*` |
| --- | --- | --- | --- | --- | --- |
| index `c[i]` | O(1) | O(1) | — | — | — |
| push/pop at back | amortised O(1) | O(1) | O(1) | — | — |
| push/pop at front | O(n) | O(1) | O(1) | — | — |
| insert/erase in the middle | O(n) | O(n) | O(1) given an iterator | O(log n) | average O(1) |
| find by value or key | O(n) | O(n) | O(n) | O(log n) | average O(1), worst O(n) |

"Given an iterator" carries the weight in the `std::list` column: the O(1) erase needs an iterator that already points at the element, and *finding* that iterator is O(n). Sorted data changes one cell — a sorted `std::vector` finds by key in O(log n) with `std::lower_bound` (Module 14, lesson 2) and is often the fastest associative structure of all for data that is built once and queried many times.

## The common interface

The containers were designed together, so the same names mean the same things everywhere. Every container has `size()`, `empty()`, `clear()`, `begin()`/`end()` (and the `const`/reverse variants), `insert`, `erase`, `swap`, a copy and a move constructor, assignment and `==`. Any function written against that interface works for any container, which is exactly what the algorithms in `<algorithm>` rely on:

```cpp
#include <iostream>
#include <list>
#include <set>
#include <vector>

template <typename Container>
void report(const char* name, const Container& c) {
    std::cout << name << " size=" << c.size() << (c.empty() ? " (empty)" : "") << ':';
    for (const auto& x : c) std::cout << ' ' << x;
    std::cout << '\n';
}

int main() {
    std::vector<int> v{3, 1, 2, 3};
    std::list<int> l{3, 1, 2, 3};
    std::set<int> s{3, 1, 2, 3};
    report("vector", v);   // vector size=4: 3 1 2 3
    report("list", l);     // list size=4: 3 1 2 3
    report("set", s);      // set size=3: 1 2 3
    v.clear();
    report("vector", v);   // vector size=0 (empty):
    return 0;
}
```

The differences are where the layouts differ. `operator[]` exists on `std::vector`, `std::deque`, `std::array`, `std::map` and `std::unordered_map` — and on the two maps it *inserts* when the key is absent (lesson 4), the most common container surprise in the language. `push_back` exists on `vector`, `deque` and `list`; `push_front` only on `deque`, `list` and `forward_list`. A member `find` exists only on the associative and unordered containers, because for a sequence nothing beats the linear `std::find`. The adaptors expose `push`, `pop` and `top` (or `front`/`back` for a queue), and nothing else.

## Value semantics

A container owns copies of what you put in it. `v.push_back(s)` copies the string `s`; `v.push_back(std::move(s))` moves it (Module 9); the container destroys its elements when it is destroyed. Copying a container copies every element; assigning one copies every element; moving one steals the buffer in O(1):

```cpp
std::vector<std::string> a{"one", "two"};
std::vector<std::string> b = a;          // two strings copied
std::vector<std::string> c = std::move(a);   // a is now empty; c owns the buffer
a.push_back("x");                        // a is valid and reusable
```

This is why `std::vector<std::unique_ptr<Shape>>` (Module 10) is the idiom for a polymorphic collection — the container owns the pointers, the pointers own the objects — and why a function that only reads a container takes it as `const std::vector<int>&` (Module 4, lesson 2).

## How to choose

Start with `std::vector`. Contiguous memory means the CPU's cache works for you, iteration is the fastest of any container, indexing is free, and `push_back` is amortised constant. Measured against `std::list`, a vector wins at inserting into the middle of a small or medium collection because the linear search for the spot dominates and the shuffle of contiguous elements is cheap (Module 19, lesson 3). Reach for something else only with a named reason:

- pushes and pops at the *front* as well as the back — `std::deque`;
- elements must stay put in memory while the collection grows, or you need O(1) splicing — `std::list`;
- keys in sorted order, "smallest key not less than k", ranges — `std::set`/`std::map`;
- fastest lookup by key and order does not matter — `std::unordered_map`/`unordered_set`;
- a push/pop discipline and nothing else — `std::stack`, `std::queue`, `std::priority_queue`;
- a size fixed at compile time — `std::array`.

A first adaptor shows how narrow an interface can be and still be exactly right:

```cpp
#include <stack>
#include <string>

bool balanced(const std::string& text) {
    std::stack<char> open;                    // std::deque<char> underneath
    for (char c : text) {
        if (c == '(' || c == '[') {
            open.push(c);
        } else if (c == ')' || c == ']') {
            const char want = (c == ')') ? '(' : '[';
            if (open.empty() || open.top() != want) return false;
            open.pop();                       // returns void; read top() first
        }
    }
    return open.empty();
}
```

`push`, `top`, `pop`, `empty`, `size` — nothing else, and no way to look below the top. The type documents the discipline.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| "Insert in the middle is O(1), so `std::list`" | The O(n) search for the position dominates; the vector is usually faster and always smaller |
| `st.top()` or `st.pop()` on an empty adaptor | Undefined behaviour — the adaptors do not throw; check `empty()` first |
| Expecting `std::set` to keep insertion order | It keeps *key* order; use a vector, or a map from key to position |
| Printing an `std::unordered_map` and expecting a stable order | The order is unspecified and changes with library version and size; sort first |
| `std::vector<Base>` for a class hierarchy | Slices every derived object (Module 10); hold `std::unique_ptr<Base>` |

## Key takeaways

- Four families: sequence (`vector`, `deque`, `list`), associative (`set`, `map`), unordered (`unordered_set`, `unordered_map`) and adaptors (`stack`, `queue`, `priority_queue`).
- The complexity table follows from the layout: contiguous → O(1) index and O(n) middle insert; nodes → the reverse; tree → O(log n); hash → average O(1).
- `size`, `empty`, `clear`, `begin`/`end`, `insert`, `erase`, `swap` and copy/move mean the same thing on every container; `operator[]`, `push_front` and a member `find` exist only where the layout makes them cheap.
- Containers own their elements by value: copying copies everything, moving is O(1).
- `std::vector` by default; every other choice needs a reason you can say in one sentence.
