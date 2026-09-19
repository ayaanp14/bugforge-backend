---
title: Choosing a collection — the complexity table and heapq
minutes: 13
---
Every collection question in an interview comes down to a table: which operations does the problem need, and which structure does each of them in constant, logarithmic or linear time. Python ships six structures that cover almost everything — `list`, `tuple`, `dict`, `set`, `deque`, and the heap functions in `heapq` — plus `bisect` over a sorted list. This lesson gives the table, the decision rules that follow from it, the `heapq` API that has not appeared yet, and the memory picture that decides between a list of tuples and a dict of lists when both would work.

## The table

| Operation | `list` | `tuple` | `dict` | `set` | `deque` | heap (`heapq` on a list) | sorted list + `bisect` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| index `x[i]` | O(1) | O(1) | O(1) by key | — | O(n) middle, O(1) ends | — | O(1) |
| `x in c` | O(n) | O(n) | O(1) | O(1) | O(n) | O(n) | O(log n) |
| append / add | O(1) | — | O(1) | O(1) | O(1) both ends | O(log n) push | O(n) insort |
| pop end | O(1) | — | O(1) `popitem` | O(1) arbitrary | O(1) both ends | O(log n) pop min | O(1) |
| insert / delete middle | O(n) | — | O(1) by key | O(1) | O(n) | — | O(n) |
| min / max | O(n) | O(n) | O(n) | O(n) | O(n) | O(1) peek min | O(1) ends |
| ordered iteration | insertion | insertion | insertion | none | insertion | none | sorted |
| `len` | O(1) | O(1) | O(1) | O(1) | O(1) | O(1) | O(1) |

"Amortised" applies to `list.append` and dict/set insertion (occasional resizes); "average" to hashing (pathological collisions aside).

## The decision rules

- **Need to look things up by a key or test membership many times?** `dict` or `set`. A list scanned with `in` inside a loop is the most common quadratic bug in Python.
- **Need order of arrival and access by position?** `list`; `tuple` if it never changes.
- **Need a queue (first in, first out) or a sliding window?** `deque` — `append` and `popleft`. A list's `pop(0)` is O(n).
- **Need a stack (last in, first out)?** `list` — `append` and `pop`.
- **Need the smallest (or largest) element repeatedly while elements keep arriving?** A heap — `heapq.heappush`/`heappop` in O(log n). Sorting after every insert is O(n log n) each time.
- **Need sorted order with binary search, and inserts are rare?** A sorted list with `bisect`.
- **Need to count or group?** `Counter`, `defaultdict` (lesson 2).
- **Need order by key with fast insert and search?** Python has no built-in balanced tree; a sorted list with `bisect` (O(n) insert) covers small cases, `sortedcontainers` (third-party) the large ones.

## heapq

`heapq` turns a plain list into a binary min-heap: the smallest element is always `h[0]`, push and pop are O(log n), and the list itself is the storage.

```python
import heapq

h = []
heapq.heappush(h, 5)
heapq.heappush(h, 1)
heapq.heappush(h, 3)
h[0]                        # 1 — peek the minimum without removing
heapq.heappop(h)            # 1
heapq.heapify(xs)           # turn an existing list into a heap in O(n)
heapq.heappushpop(h, x)     # push then pop, cheaper than the two calls
heapq.nsmallest(3, xs)      # the three smallest — O(n log k)
heapq.nlargest(3, xs, key=len)
```

There is no max-heap; push the negation (`-x`) or a tuple `(-priority, item)`. Tuples give priority queues: `heappush(h, (dist, node))` orders by distance first, and ties break on `node` — which must itself be comparable, or you insert a counter as the second element: `(priority, count, item)`. Dijkstra, k-way merge, "top k" and event simulations are the heap's problems. Never iterate a heap expecting sorted order — only `h[0]` is guaranteed; pop repeatedly to get sorted output.

## Memory, briefly

A list of `n` small ints is about `8n` bytes of pointers plus the int objects; a dict is roughly three times a list of the same length because of its hash table; a set is similar to a dict; a tuple is slightly smaller than a list; `array` and NumPy store raw numbers at 4–8 bytes each with no per-element object. The consequence for design: a list of tuples `[(name, score), …]` is compact and fine for iteration; a dict `{name: score}` costs more but answers lookups — choose by the operations, and convert (`dict(pairs)`) when the access pattern changes.

## Combining structures

Real solutions pair them: a `deque` for the BFS frontier *and* a `set` for visited; a `dict` from key to index *and* a `list` for order; a heap of `(priority, item)` *and* a `dict` of current priorities to detect stale entries; `Counter` for counts *and* `heapq.nlargest` for the top ones. The question is always "which operations, how often" — and the table answers it.

## Pitfalls

- `x in list` inside a loop.
- `list.pop(0)` for a queue.
- Re-sorting a list to get the minimum after each insert.
- Pushing incomparable items into a heap as tuples without a tie-breaker.
- Expecting `heapq` to give a max-heap or sorted iteration.
- Choosing a dict for data that is only ever iterated in order.

## Key takeaways

- Lookup and membership: dict/set O(1). Position and order: list/tuple. Two-ended queue: deque. Repeated minimum: heap. Sorted with rare inserts: bisect.
- `list.pop(0)`, `in` on a list, and re-sorting per insert are the three quadratic habits to unlearn.
- `heapq` is a min-heap over a list: `heappush`, `heappop`, `h[0]`, `heapify`, `nsmallest`/`nlargest`; negate or use tuples for max and priorities, with a counter to break ties.
- A dict costs about three times a list; choose by operations, convert when the access pattern changes.
- Real solutions combine structures: frontier + visited, heap + dict, counter + top-k.
