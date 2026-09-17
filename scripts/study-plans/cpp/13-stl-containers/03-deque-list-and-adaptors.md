---
title: deque, list and the adaptors — stack, queue and priority_queue
minutes: 14
---
Two sequence containers and three adaptors cover the situations a vector does not. `std::deque` is for when both ends move; `std::list` is for when elements must stay put while the collection changes around them; and `std::stack`, `std::queue` and `std::priority_queue` are for when a discipline — last in first out, first in first out, largest first — is the whole point and a wider interface would only invite mistakes. This lesson covers the layout and cost of each, the `pop()` that returns nothing and why, the comparator convention of `std::priority_queue` that everyone gets backwards once, and the breadth-first search a queue was made for.

## std::deque — stable at both ends

A deque (double-ended queue) stores its elements in fixed-size blocks and keeps a small index of block pointers. Pushing at either end adds to the current end block or allocates a new one; nothing already stored is moved. Indexing is O(1) — block number and offset — so `d[i]`, `front()`, `back()`, `push_front`, `push_back`, `pop_front` and `pop_back` are all constant time:

```cpp
#include <deque>
#include <iostream>

int main() {
    std::deque<int> window;
    for (int x : {4, 8, 15, 16, 23, 42}) {
        window.push_back(x);
        if (window.size() > 3) window.pop_front();       // keep the last three
    }
    for (int x : window) std::cout << x << ' ';           // 16 23 42
    std::cout << '\n' << window[1] << '\n';               // 23
    return 0;
}
```

The blocks mean a deque is not contiguous: there is no `data()`, iteration is a little slower than a vector's, and inserting in the middle is still O(n). Its invalidation rule is worth memorising: a push at either end invalidates every *iterator* but no *reference*, because the elements themselves do not move; an insert in the middle invalidates everything. It is the right container for a sliding window, a work queue consumed from the front, and any buffer that grows at one end and shrinks at the other.

## std::list — nodes that never move

A `std::list` is a doubly linked list: each element lives in its own heap node with pointers to its neighbours. That layout gives three guarantees no contiguous container can: inserting or erasing anywhere is O(1) *once you hold an iterator to the spot*; an iterator, pointer or reference to an element stays valid until that element is erased, whatever happens to the rest of the list; and `splice` moves elements between lists, or within one, by relinking nodes without copying anything.

```cpp
#include <iostream>
#include <list>

int main() {
    std::list<int> l{1, 2, 3};
    auto two = std::next(l.begin());        // iterator to 2
    l.push_front(0);
    l.push_back(4);                         // two is still valid
    l.insert(two, 99);                      // 0 1 99 2 3 4 — O(1), two still valid
    l.erase(two);                           // 0 1 99 3 4
    std::list<int> other{7, 8};
    l.splice(l.end(), other);               // 0 1 99 3 4 7 8; other is now empty
    l.sort();                               // a member: std::sort needs random access
    for (int x : l) std::cout << x << ' ';  // 0 1 3 4 7 8 99
    std::cout << '\n';
    return 0;
}
```

What a list gives up is everything positional: there is no `operator[]`, reaching the k-th element is O(k), every node is a separate allocation, and iteration chases pointers across the heap, which the cache hates. Measured, a vector beats a list at almost every workload until the elements are large and the collection is huge (Module 19). The honest reasons to use one are the guarantees above — stable addresses and O(1) splicing — and the classic use is an LRU cache, where a list keeps recency order and a hash map holds iterators into it (the checkpoint builds one). `std::forward_list` is the singly linked version: smaller nodes, forward iteration only.

## The adaptors

An adaptor holds a sequence container and exposes only the operations of one discipline. `std::stack<T>` and `std::queue<T>` wrap a `std::deque<T>` by default; `std::priority_queue<T>` wraps a `std::vector<T>` kept as a binary heap. None of them has iterators or `operator[]` — if you need to look inside, you wanted the underlying container.

| Adaptor | Discipline | Inspect | Push | Pop | Cost |
| --- | --- | --- | --- | --- | --- |
| `std::stack` | last in, first out | `top()` | `push`/`emplace` | `pop()` | O(1) |
| `std::queue` | first in, first out | `front()`, `back()` | `push`/`emplace` | `pop()` | O(1) |
| `std::priority_queue` | largest first | `top()` | `push`/`emplace` | `pop()` | O(log n) push and pop |

`pop()` returns `void` on all three, and the reason is worth knowing for interviews. If `pop()` returned the element by value and the copy threw an exception (a `std::string` that cannot allocate, say), the element would already be gone from the container and lost for good. Separating `top()` (look) from `pop()` (remove) keeps the strong exception guarantee (Module 15, lesson 2) — so the idiom is always two lines: read `top()` or `front()`, then `pop()`. Calling `top()`, `front()` or `pop()` on an empty adaptor is undefined behaviour; check `empty()` first.

## std::priority_queue and its comparator

The default `std::priority_queue<int>` is a max-heap: `top()` is the largest element. For the smallest first, supply the underlying container and `std::greater`:

```cpp
#include <functional>
#include <queue>
#include <vector>

std::priority_queue<int> largestFirst;                                        // top() is max
std::priority_queue<int, std::vector<int>, std::greater<int>> smallestFirst;  // top() is min
```

For anything richer, a comparator. The convention trips everyone once: the comparator is called as `comp(a, b)` and must return `true` when `a` has **lower** priority than `b` — when `a` should come out *after* `b`. `std::less` puts the greatest on top because "a < b" means "a comes out after b". A scheduler that runs the highest priority first and breaks ties by the earlier deadline therefore says:

```cpp
struct Task {
    std::string name;
    int priority;
    int deadline;
};

struct ByUrgency {
    bool operator()(const Task& a, const Task& b) const {
        if (a.priority != b.priority) return a.priority < b.priority;   // lower priority comes later
        return a.deadline > b.deadline;                                  // later deadline comes later
    }
};

std::priority_queue<Task, std::vector<Task>, ByUrgency> tasks;
tasks.push({"deploy", 5, 30});
tasks.emplace("lint", 2, 10);
const Task& next = tasks.top();       // deploy
```

A lambda works too — `std::priority_queue<Task, std::vector<Task>, decltype(cmp)> pq(cmp);` — because the comparator type is part of the queue's type and a lambda object must be handed to the constructor. For quick work, `std::priority_queue<std::pair<int, std::string>>` orders pairs lexicographically, by the `int` then the string, with no comparator at all. The comparator must be a strict weak ordering (`false` for equal elements), and the queue offers no way to change an element's priority once it is in — the usual trick is to push a fresh entry and skip stale ones as they surface.

## Breadth-first search with std::queue

A queue is the data structure of breadth-first search: process the frontier in the order it was discovered, and the first time the goal comes off the queue you have the shortest path. On a grid with four-neighbour moves:

```cpp
#include <queue>
#include <utility>
#include <vector>

int shortest(const std::vector<std::string>& grid, std::pair<int, int> start, std::pair<int, int> goal) {
    const int rows = static_cast<int>(grid.size());
    const int cols = static_cast<int>(grid[0].size());
    std::vector<std::vector<int>> dist(rows, std::vector<int>(cols, -1));
    std::queue<std::pair<int, int>> frontier;
    dist[start.first][start.second] = 0;
    frontier.push(start);
    const int dr[] = {-1, 1, 0, 0};
    const int dc[] = {0, 0, -1, 1};
    while (!frontier.empty()) {
        auto [r, c] = frontier.front();
        frontier.pop();
        if (r == goal.first && c == goal.second) return dist[r][c];
        for (int k = 0; k < 4; ++k) {
            const int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (grid[nr][nc] == '#' || dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[r][c] + 1;
            frontier.push({nr, nc});
        }
    }
    return -1;
}
```

The `dist` grid doubles as the visited set — mark a cell *when it is pushed*, not when it is popped, or the same cell enters the queue many times. Swap the `std::queue` for a `std::stack` and the same loop is depth-first search; swap it for a `std::priority_queue` keyed on distance and it is Dijkstra's algorithm.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `auto x = st.pop();` | Does not compile: `pop()` returns `void`; read `top()` first |
| `top()`/`front()`/`pop()` on an empty adaptor | Undefined behaviour; test `empty()` |
| Comparator returns `a.priority > b.priority` for "highest first" | Inverted — the *lowest* priority surfaces first |
| `std::sort(l.begin(), l.end())` on a `std::list` | Does not compile (needs random access); call `l.sort()` |
| Choosing `std::list` for "lots of inserts" | Usually slower than a vector; the reason for a list is stable iterators or `splice` |
| Marking BFS cells visited on pop instead of push | Cells enqueued repeatedly; still correct but far slower |

## Key takeaways

- `std::deque` is O(1) at both ends with O(1) indexing; pushes at the ends keep references valid but invalidate iterators.
- `std::list` gives stable iterators, O(1) insert/erase at a known position and O(1) `splice`; it pays with no indexing and cache-unfriendly nodes.
- `std::stack`, `std::queue` and `std::priority_queue` expose only their discipline; `pop()` returns `void` for exception safety, so read then pop.
- `std::priority_queue` is a max-heap by default; `std::greater` flips it; a comparator returns `true` when the first argument has lower priority.
- A queue is breadth-first search; mark visited on push.
