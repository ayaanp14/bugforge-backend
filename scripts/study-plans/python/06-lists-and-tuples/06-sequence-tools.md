---
title: The sequence tools — enumerate, zip, reversed, any, all, deque and the protocol
minutes: 13
---
The built-ins that work on *every* sequence are a small set worth knowing cold: `enumerate`, `zip`, `reversed`, `sorted`, `min`/`max`/`sum`, `any`/`all`, `len`, `in`, slicing. Most have appeared already; this lesson collects them, adds `range` as a first-class sequence, introduces `collections.deque` for the two-ended operations a list does badly, mentions `array` for compact numeric storage, and closes with the *sequence protocol* — the two methods a class implements to be treated as a sequence by all of the above.

## The tools

| Tool | What it gives | Note |
| --- | --- | --- |
| `len(s)` | element count | O(1) |
| `x in s` | membership | O(n) for list/tuple/str; O(1) for set/dict |
| `s[i]`, `s[a:b:c]` | element, slice | slicing copies |
| `enumerate(s, start=0)` | `(index, element)` pairs | lazy |
| `zip(a, b, strict=False)` | tuples of parallel elements | stops at the shortest; `strict=True` raises on mismatch |
| `reversed(s)` | elements back to front | an iterator, not a list; `s[::-1]` for a list |
| `sorted(s, key=, reverse=)` | a new sorted list | works on any iterable |
| `min(s)`, `max(s)`, `sum(s)` | extremes and total | `default=` for empty; `key=` on min/max; `sum(s, start)` |
| `any(s)`, `all(s)` | is any / every element truthy | short-circuit; `all([])` is `True` |
| `list(s)`, `tuple(s)`, `set(s)` | conversions | from any iterable |

```python
any(x < 0 for x in xs)                    # "has a negative"
all(a <= b for a, b in zip(xs, xs[1:]))   # "is sorted"
max(range(10), key=lambda i: -abs(i - 4)) # argmax-style: the i closest to 4
sum(len(w) for w in words)                # total length
list(zip(*pairs))                         # unzip: [(a1, a2, …), (b1, b2, …)]
```

`zip(xs, xs[1:])` pairs each element with its successor — the "consecutive pairs" idiom, also available as `itertools.pairwise(xs)` (3.10).

## range as a sequence

`range` is not just for loops. It is an immutable sequence: `len(range(10))` is 10, `range(10)[3]` is 3, `range(0, 100, 5)[::-1]` is another range, `50 in range(0, 100, 5)` is answered arithmetically, and `list(range(5))` materialises it. A range holds three integers however large its extent — `range(10 ** 12)` costs nothing until iterated.

## deque: a double-ended queue

A list is fast at its right end and slow at its left (`insert(0, x)` and `pop(0)` shift every element). `collections.deque` is fast at both ends:

```python
from collections import deque

q = deque([1, 2, 3])
q.append(4)         # right end, O(1)
q.appendleft(0)     # left end, O(1)
q.pop()             # 4
q.popleft()         # 0
q.rotate(1)         # [3, 1, 2] — right rotation; negative rotates left
q[0], q[-1]         # indexing works; the middle is O(n)
window = deque(maxlen=3)      # a bounded deque drops the oldest when full
```

Two uses dominate. A **queue** for breadth-first search: `append` to enqueue, `popleft` to dequeue, `while q:` to drain. A **sliding window** with `maxlen`: append each new value and the deque holds the last k automatically. A deque is not a list — no slicing, and indexing the middle is linear — so convert with `list(q)` when you need those.

## array: compact homogeneous storage

`array.array("i", [1, 2, 3])` stores C ints in a contiguous buffer, one machine word each, instead of a list of Python objects (about eight times smaller for ints). It supports the sequence operations and is what to reach for when millions of numbers must be held and memory matters; for numeric *computation* NumPy is the tool (Module 19). `bytearray` is the mutable byte sequence and `bytes` the immutable one (Module 14).

## The sequence protocol

The tools above work on strings, lists, tuples, ranges and deques because those types implement a protocol, and a class of yours can implement it too:

```python
class Countdown:
    def __init__(self, n):
        self.n = n

    def __len__(self):
        return self.n

    def __getitem__(self, i):
        if i < 0:
            i += self.n
        if not 0 <= i < self.n:
            raise IndexError(i)
        return self.n - i

c = Countdown(3)
len(c)              # 3
c[0], c[-1]         # 3, 1
list(c)             # [3, 2, 1] — iteration falls back on __getitem__ from 0 until IndexError
2 in c              # True — membership falls back on iteration
list(reversed(c))   # [1, 2, 3] — reversed uses __len__ and __getitem__
```

`__len__` and `__getitem__` (raising `IndexError` at the end) are enough for `len`, indexing, iteration, `in`, `reversed`, `enumerate`, `zip` and `sorted` to work. `__contains__`, `__iter__` and `__reversed__` can be added for efficiency or a different behaviour; `collections.abc.Sequence` (Module 9) fills in `index` and `count` from the two basic methods. Slicing support means handling a `slice` object in `__getitem__` (`if isinstance(i, slice)`). Module 8 covers the dunder methods in full.

## Pitfalls

- `reversed(xs)` used twice — it is an iterator, exhausted after one pass; `xs[::-1]` is a list.
- `max([])` — `ValueError`; pass `default=`.
- `zip` silently truncating when the inputs should match — `strict=True`.
- `list.pop(0)` in a BFS — a `deque`.
- Slicing a `deque` — convert to a list first.
- A `__getitem__` that never raises `IndexError`, making `list(obj)` an infinite loop.

## Key takeaways

- `enumerate`, `zip`, `reversed`, `sorted`, `min`/`max`/`sum`, `any`/`all` work on every sequence and most iterables; the generator argument form is the idiom.
- `range` is a lazy immutable sequence — index it, slice it, test membership arithmetically.
- `deque` gives O(1) `append`/`pop` at both ends; use it for queues and `maxlen` windows, not for slicing or middle access.
- `array` stores homogeneous numbers compactly; NumPy is the computation tool.
- Implement `__len__` and `__getitem__` (raising `IndexError`) and the whole toolset works on your class.
