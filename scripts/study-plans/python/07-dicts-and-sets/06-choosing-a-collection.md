---
title: Choosing a collection — the complexity table and heapq
minutes: 13
seo-title: Python Data Structure Time Complexity and heapq Explained
description: Which Python collection to use: the Big-O of list, tuple, dict, set, deque, heap and bisect side by side, the decision rules, and heapq for priority queues.
question: When should I use a list, tuple, set or dict in Python?
answer: Choose by the operations the problem needs. Use a dict or set to look things up by key or test membership often, both O(1) on average. Use a list for ordered data accessed by position and a tuple when it never changes; a `deque` for a queue, a heap from `heapq` for a repeated minimum, and a sorted list with `bisect` for binary search.
q: How do I use heapq in Python?
a: `heapq` keeps a plain list as a binary min-heap: `heappush(h, x)` and `heappop(h)` run in O(log n), `h[0]` peeks at the smallest element, and `heapify(xs)` converts an existing list in O(n). `nsmallest` and `nlargest` return the top k items.
q: How do I make a max-heap in Python?
a: `heapq` provides only a min-heap, so push negated values, `-x`, and negate again when you pop, or push tuples such as `(-priority, item)`. The smallest negated value is the largest original one.
q: How do I build a priority queue in Python?
a: Push `(priority, item)` tuples onto a list with `heapq.heappush` and take the lowest priority with `heappop`. When priorities tie the items are compared next, so add a counter as a tie-breaker, `(priority, count, item)`, if the items are not comparable.
q: What is the time complexity of Python list, dict and set operations?
a: Indexing and appending to a list are O(1), but `x in list`, `insert` and `pop(0)` are O(n). Dict lookup, insertion and deletion, and set membership and insertion, are O(1) on average. A `deque` is O(1) at both ends, and a heap push or pop is O(log n).
q: Why is a heap not in sorted order when I iterate it?
a: A heap guarantees only that `h[0]` is the smallest element; the rest of the list is only partially ordered. To get sorted output, pop repeatedly with `heappop`, or sort the list.
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
