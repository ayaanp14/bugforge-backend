---
title: The cost model — what the built-in operations really cost
minutes: 15
---
A Python program's speed is decided first by its algorithm and second by which built-in operations it leans on, because each built-in has a cost fixed by its implementation: appending to a list is amortised constant time, inserting at the front is linear, `x in some_list` scans, `x in some_set` hashes. Knowing the table below is what lets you look at a loop and see the quadratic hiding in it. This lesson gives the costs of the list, dict, set, string and deque operations, the hidden costs — copying, hashing, allocation, function calls — and the substitutions that turn a slow shape into a fast one.

## The table

| Operation | Cost | Note |
| --- | --- | --- |
| `lst[i]`, `lst[i] = x`, `len(lst)` | O(1) | array of pointers |
| `lst.append(x)`, `lst.pop()` | O(1) amortised | over-allocation |
| `lst.insert(0, x)`, `lst.pop(0)`, `del lst[0]` | O(n) | shifts everything |
| `x in lst`, `lst.index(x)`, `lst.remove(x)` | O(n) | linear scan |
| `lst[a:b]` | O(b − a) | copies |
| `lst.sort()`, `sorted(xs)` | O(n log n) | Timsort; O(n) on nearly sorted data |
| `min`, `max`, `sum` | O(n) | C loop |
| `d[k]`, `d[k] = v`, `k in d`, `del d[k]` | O(1) average | hashing; O(n) worst case |
| `s.add`, `x in s`, `s.remove` | O(1) average | hashing |
| `a & b`, `a \| b`, `a - b` (sets) | O(len a + len b) | |
| `str + str` | O(len) | a new string each time |
| `"".join(parts)` | O(total) | one allocation |
| `s in text`, `text.find(s)` | O(n) | fast C search |
| `deque.append/appendleft/pop/popleft` | O(1) | doubly linked blocks |
| `deque[i]` | O(n) | middle access is slow |
| `heapq.heappush/heappop` | O(log n) | `nsmallest(k)` is O(n log k) |
| `bisect.bisect` | O(log n) | but `insort` is O(n) for the shift |

## The shapes that hide a quadratic

```python
result = []
for item in items:
    if item not in result:          # O(n) scan inside an O(n) loop: O(n²)
        result.append(item)

seen = set()                        # O(1) membership: O(n) overall
result = [x for x in items if not (x in seen or seen.add(x))]
```

```python
text = ""
for piece in pieces:
    text += piece                   # may copy the whole string each time
text = "".join(pieces)              # one pass

queue = [...]
while queue:
    item = queue.pop(0)             # O(n) per pop: O(n²) drain
from collections import deque
queue = deque([...]); queue.popleft()   # O(1)

for i in range(len(xs)):
    for j in range(i):              # honest O(n²): sometimes necessary, always visible
        ...
```

The pattern is always the same: a linear operation (`in` on a list, `pop(0)`, `insert(0)`, string concatenation, `list.remove`) inside a loop over the same data. The fix is the data structure whose operation is constant: a set or dict for membership, a deque for both ends, a join for strings, a heap for repeated minimums, `bisect` on a sorted list for range questions.

## Sorting, and the cheap version of it

`sorted` with a key is O(n log n) and hard to beat with anything hand-written; sorting once and then binary searching (`bisect`) answers many queries in O(log n) each. `heapq.nlargest(k, xs)` is O(n log k) — much cheaper than sorting when k is small — and `min`/`max` are O(n) with no allocation. `sorted(xs)[:k]` when k = 3 is the common waste.

## Hidden costs

- **Copying.** A slice, `list(xs)`, `dict(d)`, `sorted(xs)`, `+` on sequences and `str.replace` all allocate a copy; inside a loop that is a hidden factor of n. `itertools.islice` and views (`d.keys()`, `memoryview`) avoid it.
- **Hashing.** A dict lookup hashes the key; strings cache their hash, tuples recompute it from their elements each time. Very long tuple keys are not free.
- **Allocation.** Every int above 256, every float, every tuple is an allocation; `sum(x * x for x in xs)` allocates a float per element. Vectorised NumPy (lesson 5) avoids the per-element object.
- **Function calls.** A Python-level call costs on the order of 50–100 ns in 3.11 — cheap, but a million calls in a hot loop is 100 ms. Inlining the body or using a comprehension removes it; `map(f, xs)` with a built-in `f` stays in C.
- **Attribute and global lookup.** `self.items.append` in a loop performs two lookups per iteration; `append = self.items.append` before the loop performs them once (lesson 3 explains why).
- **Exceptions.** Raising is a few microseconds; a `try` that does not raise is free in 3.11 (zero-cost exceptions). `try/except KeyError` around a lookup that usually succeeds beats `if k in d: d[k]`.

## Memory as a cost

Every structure above has a size: a dict costs roughly three times the memory of the equivalent list of tuples; a set of a million ints is ~32 MB; a list of a million floats is 8 MB of pointers plus 24 MB of floats. Memory is time — allocation, cache misses, the collector's scans — and the judge's 256 MB limit is reachable with careless intermediates. Generators, `array`, NumPy and `__slots__` are the levers.

## An estimate you can do in your head

CPython executes roughly 10–50 million simple bytecode operations a second; a Python-level loop iteration doing a few operations costs about 50–100 ns; a C-level loop (`sum`, `max`, `str.join`, `sorted`, set operations) runs 10–100 times faster per element. So 10⁶ iterations of a simple loop is ~0.1 s, 10⁷ is a second, and 10⁸ is not going to finish under a one-second limit unless it happens in C. Given n, count the operations, and you know before running whether the design is viable.

## Pitfalls

- `x in list` inside a loop.
- `pop(0)`/`insert(0, …)` as a queue.
- String concatenation in a loop to build output; use `join` or write lines as you go.
- `sorted(xs)[0]` for the minimum, `sorted(xs)[:3]` for the top three.
- Slicing inside a loop (`xs[i:]`) — each slice copies.
- Estimating by intuition instead of counting operations.

## Key takeaways

- List index/append are O(1), front operations and membership O(n); dict and set operations are O(1) average; sorting is O(n log n).
- A linear operation inside a loop over the same data is a quadratic; replace it with a set, dict, deque, join, heap or bisect.
- Copies, hashing, allocation, function calls and attribute lookups are the hidden per-iteration costs.
- Memory is time; generators, raw arrays and slots reduce it.
- ~10⁷ simple Python operations a second: count the operations and predict the running time before you run.
