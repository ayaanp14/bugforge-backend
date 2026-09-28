---
title: Checkpoint — Dictionaries and sets
minutes: 25
seo-title: Python Dict and Set Quiz: Counter, Hashing and heapq Practice
description: Test your Python dictionaries and sets with 12 questions and three programs on get and setdefault, Counter, defaultdict, set algebra, hashing, JSON and heapq.
q: When do you use `d[k]`, `d.get(k)`, `k in d` and `d.setdefault(k, v)`?
a: Use `d[k]` when the key must exist, so a `KeyError` exposes a bug; `d.get(k, default)` when absence is normal; `k in d` when only presence matters; and `d.setdefault(k, v)` to insert a default if the key is missing and use the value in one step.
q: What happens to `__hash__` when a class defines `__eq__`?
a: Python sets `__hash__` to `None`, so instances become unhashable and cannot be dict keys or set members. Fix it by defining `__hash__` over a tuple of the same fields `__eq__` compares, or use `@dataclass(frozen=True)`.
q: What does reading a missing key from a defaultdict do?
a: It calls the factory, stores the new value under that key and returns it, so reading `groups["x"]` from a `defaultdict(list)` inserts an empty list. Test presence with `in` when the key must not be created as a side effect.
---
This checkpoint covers the whole module: dictionaries with `get`, `setdefault`, views and merging, counting and grouping with `Counter` and `defaultdict`, sets with their algebra and the ordering caveat, hashing and the equality contract that decides what can be a key, nested data and JSON with deterministic output, and the complexity table with `heapq`.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- When do you use `d[k]`, `d.get(k)`, `k in d` and `d.setdefault(k, v)`?
- What does `Counter(words).most_common(3)` return, and how are ties ordered?
- What does reading a missing key from a `defaultdict` do?
- Why must a set never be printed directly, and what do you print instead?
- What happens to `__hash__` when a class defines `__eq__`, and how do you fix it?
- Which `json.dumps` option makes two equal dicts serialise identically?
- Which structure gives repeated minimum extraction in O(log n), and how do you get a max-heap from it?

The three programs are a word-frequency report with a deterministic tie-break, a two-snapshot comparison built on set algebra, and a task scheduler that pops the highest-priority job from a heap of tuples.
