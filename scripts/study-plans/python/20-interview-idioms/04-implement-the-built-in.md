---
title: Implement the built-in — a hash map, a dynamic array, an LRU cache and a heap by hand
minutes: 16
---
"Implement a hash map" is the interview question that checks whether you know what `dict` costs and why; "implement an LRU cache" checks whether you can combine two structures to get O(1) for everything; "implement a heap" checks whether you understand the invariant behind `heapq`. None of these is used in production Python — the built-ins are faster and correct — but each is a compact demonstration of the ideas the earlier modules taught, and each has a standard shape an interviewer expects to see: the invariant stated, the operations written against it, the amortised analysis given. This lesson builds the four with those shapes.

## A hash map with chaining

```python
class HashMap:
    def __init__(self, capacity=8):
        self._buckets = [[] for _ in range(capacity)]
        self._size = 0

    def _bucket(self, key):
        return self._buckets[hash(key) % len(self._buckets)]

    def get(self, key, default=None):
        for k, v in self._bucket(key):
            if k == key:
                return v
        return default

    def put(self, key, value):
        bucket = self._bucket(key)
        for i, (k, _) in enumerate(bucket):
            if k == key:
                bucket[i] = (key, value)
                return
        bucket.append((key, value))
        self._size += 1
        if self._size > 0.75 * len(self._buckets):
            self._resize(2 * len(self._buckets))

    def delete(self, key):
        bucket = self._bucket(key)
        for i, (k, _) in enumerate(bucket):
            if k == key:
                del bucket[i]
                self._size -= 1
                return True
        return False

    def _resize(self, capacity):
        pairs = [pair for bucket in self._buckets for pair in bucket]
        self._buckets = [[] for _ in range(capacity)]
        for key, value in pairs:
            self._bucket(key).append((key, value))

    def __len__(self):
        return self._size
```

The points to say aloud: the *invariant* is that a key lives in the bucket its hash selects; `get`/`put`/`delete` are O(1) *average* because buckets stay short while the *load factor* (size / buckets) is bounded — hence the resize at 0.75, which rehashes every key (O(n)) but happens so rarely that the cost is amortised O(1) per insertion; a bad hash (every key to one bucket) degrades to O(n). CPython's dict uses open addressing with a compact entry array instead of chains, keeps insertion order, and resizes at 2/3 — the follow-up questions. Keys must be hashable, and equal keys must hash equal, which is why `__eq__` and `__hash__` go together (Module 8).

## A dynamic array

```python
class DynamicArray:
    def __init__(self):
        self._capacity = 4
        self._store = [None] * self._capacity
        self._size = 0

    def append(self, value):
        if self._size == self._capacity:
            self._grow()
        self._store[self._size] = value
        self._size += 1

    def _grow(self):
        self._capacity *= 2
        new = [None] * self._capacity
        for i in range(self._size):
            new[i] = self._store[i]
        self._store = new

    def __getitem__(self, i):
        if not 0 <= i < self._size:
            raise IndexError(i)
        return self._store[i]

    def pop(self):
        if not self._size:
            raise IndexError("pop from empty")
        self._size -= 1
        value, self._store[self._size] = self._store[self._size], None
        return value

    def __len__(self):
        return self._size
```

Doubling the capacity makes `append` amortised O(1): n appends copy at most 1 + 2 + 4 + … + n < 2n elements in total. Growing by a constant instead of a factor would make it O(n²). CPython's list over-allocates by about 12.5 % (a smaller factor, so more frequent but cheaper copies), which is the follow-up.

## An LRU cache

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self._items = OrderedDict()

    def get(self, key):
        if key not in self._items:
            return None
        self._items.move_to_end(key)          # most recently used goes last
        return self._items[key]

    def put(self, key, value):
        if key in self._items:
            self._items.move_to_end(key)
        self._items[key] = value
        if len(self._items) > self.capacity:
            self._items.popitem(last=False)   # evict the least recently used: the first
```

The requirement is O(1) `get` and `put` including eviction. A dict gives O(1) lookup but no order; a list gives order but O(n) moves; the combination is a dict whose values are nodes of a doubly linked list, so a node can be unlinked and re-linked at the tail in O(1) — which is exactly what `OrderedDict.move_to_end` and `popitem(last=False)` do. In a round, write the `OrderedDict` version first and say how the linked list would replace it; if asked for the linked list, a dummy head and tail node remove every edge case from unlink/append. `functools.lru_cache` is the decorator form.

## A binary heap

```python
class MinHeap:
    def __init__(self):
        self._a = []

    def push(self, x):
        a = self._a
        a.append(x)
        i = len(a) - 1
        while i and a[(i - 1) // 2] > a[i]:              # sift up
            a[(i - 1) // 2], a[i] = a[i], a[(i - 1) // 2]
            i = (i - 1) // 2

    def pop(self):
        a = self._a
        top, last = a[0], a.pop()
        if a:
            a[0] = last
            i, n = 0, len(a)
            while True:                                  # sift down
                left, right, smallest = 2 * i + 1, 2 * i + 2, i
                if left < n and a[left] < a[smallest]: smallest = left
                if right < n and a[right] < a[smallest]: smallest = right
                if smallest == i: break
                a[i], a[smallest] = a[smallest], a[i]
                i = smallest
        return top

    def peek(self):
        return self._a[0]

    def __len__(self):
        return len(self._a)
```

The invariant: every parent is at most its children, stored in an array where the children of `i` are `2i + 1` and `2i + 2`. Push appends and sifts up; pop swaps the last element to the root and sifts down; both are O(log n) because the tree's height is log n. `heapify` builds one in O(n) by sifting down from the last parent. A max-heap flips the comparison or negates the keys.

## What else gets asked

`enumerate` and `zip` as generators (`yield` with a counter; `zip` stops at the shortest); a `Counter` as a `defaultdict(int)`; `defaultdict` as a dict subclass with `__missing__` (Module 16); `functools.cache` as a dict in a closure; a `deque` as a ring buffer with head and tail indices; `itertools.groupby` as a generator over runs; a trie as nested dicts. For each, state the invariant, write the operations, give the complexity — the same shape.

## Pitfalls

- A hash map with no resize (O(n) lookups as it fills) or one that resizes by a constant.
- Forgetting that `put` on an existing key must replace, not append a duplicate.
- An LRU with a list — O(n) moves — and calling it O(1).
- A heap that sifts only one direction or forgets the empty case in `pop`.
- Using `hash()` of strings to derive *output* — it is randomised per process (Module 7); bucket counts and lookups are fine, printed bucket contents are not.
- Skipping the complexity statement.

## Key takeaways

- A hash map is buckets selected by `hash(key) % n` with a bounded load factor and a doubling resize: O(1) average, amortised.
- A dynamic array doubles its capacity for amortised O(1) `append`.
- An LRU cache is a dict plus a doubly linked list — `OrderedDict` with `move_to_end` and `popitem(last=False)` — for O(1) everything.
- A binary heap is an array with the parent-child invariant; push sifts up, pop sifts down, O(log n).
- The interview shape: invariant, operations, complexity, then the built-in that does it better.
