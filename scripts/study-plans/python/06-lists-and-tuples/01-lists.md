---
title: Lists — the mutable sequence
minutes: 14
---
The list is Python's workhorse collection: an ordered, mutable sequence of any objects, growable at the end in constant time, indexable and sliceable like a string, and — because it is mutable — the first place the name-versus-object model of Module 2 produces a visible surprise. This lesson covers construction, the methods grouped by what they do, the cost of each, the aliasing and copying rules, and the `[[0] * n] * m` trap that every learner meets exactly once.

## Building lists

```python
empty = []
nums = [3, 1, 4, 1, 5]
mixed = [1, "two", 3.0, [4]]           # any objects, any mix
from_iter = list("abc")                # ['a', 'b', 'c'] — any iterable
zeros = [0] * 5                        # [0, 0, 0, 0, 0]
squares = [x * x for x in range(5)]    # comprehension (next lesson)
```

`list(iterable)` copies any iterable into a new list; `[x] * n` repeats a *reference* `n` times, which is fine for immutable `x` and the trap for mutable `x` (below).

## Reading

`xs[i]`, negative indexes, and slicing work exactly as for strings (Module 5): `xs[-1]` is the last element, `xs[1:3]` a new list of two, `xs[::-1]` a reversed copy. `len(xs)`, `x in xs` (a linear scan), `xs.index(x)` (position or `ValueError`), `xs.count(x)`, `min`/`max`/`sum`/`sorted` all apply. Indexing past the end is `IndexError`; slicing clips.

## Changing a list

| Method | Effect | Cost |
| --- | --- | --- |
| `xs.append(x)` | add at the end | O(1) amortised |
| `xs.extend(iter)` / `xs += iter` | add every element of an iterable | O(k) |
| `xs.insert(i, x)` | insert before index `i` | O(n) — shifts the tail |
| `xs.pop()` | remove and return the last | O(1) |
| `xs.pop(i)` | remove and return index `i` | O(n) |
| `xs.remove(x)` | remove the first equal element (`ValueError` if none) | O(n) |
| `del xs[i]`, `del xs[a:b]` | remove by index or slice | O(n) |
| `xs.clear()` | empty it | O(n) |
| `xs[i] = v`, `xs[a:b] = [...]` | replace an element or a slice (the slice may change length) | O(1) / O(n) |
| `xs.sort()`, `xs.reverse()` | in place | O(n log n) / O(n) |

Every method in this table returns `None` — `append`, `sort`, `reverse`, `extend` all modify in place — so `xs = xs.append(4)` throws the list away (Module 4). The copying counterparts are `sorted(xs)` and `xs[::-1]` (or `reversed(xs)` for an iterator).

The costs matter in loops. `pop(0)` and `insert(0, x)` shift every element and make a queue built on a list quadratic; `collections.deque` is the constant-time answer (Module 6 lesson 6). `x in xs` scans the whole list; a `set` answers in constant time (Module 7). `append` is cheap because the list over-allocates and grows geometrically.

## Aliasing and copying

```python
a = [1, 2, 3]
b = a               # alias: same list
b.append(4)         # a is [1, 2, 3, 4]

c = a.copy()        # or list(a), or a[:] — a new list with the same elements
c.append(5)         # a unchanged
```

A copy made by `copy()`, `list()` or `[:]` is **shallow**: the new list holds the *same element objects*. For a list of numbers or strings that is a full copy, because those cannot change. For a list of lists it is not:

```python
grid = [[1, 2], [3, 4]]
g2 = grid.copy()
g2[0].append(9)     # grid[0] is [1, 2, 9] too — the inner lists are shared
g2[0] = [0]         # grid[0] unchanged — rebinding an element of the copy is fine

import copy
g3 = copy.deepcopy(grid)   # recursive copy; nothing shared
```

Passing a list to a function passes the object, so the function can mutate it; if the caller must keep the original, the function should copy or the caller should pass a copy — say which in the docstring.

## The multiplication trap

```python
row = [0] * 3
grid = [row] * 3           # three references to ONE row
grid[0][0] = 1
print(grid)                # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]

grid = [[0] * 3 for _ in range(3)]   # three separate rows
grid[0][0] = 1
print(grid)                # [[1, 0, 0], [0, 0, 0], [0, 0, 0]]
```

`[x] * n` copies the reference, not the object. For an inner list the comprehension creates a fresh one per row — the only correct way to build a grid of mutable rows (Module 6 lesson 5).

## Equality and ordering

`==` compares element by element (and nested lists recursively); `is` compares identity. Lists compare lexicographically with `<`, like strings and tuples, which is what makes `sorted` on a list of lists work. `xs == []` and `not xs` both test emptiness; the second is idiomatic.

## Iterating and modifying

Do not append to or remove from a list while a `for` is iterating over it (Module 3). Build a new list with a comprehension, iterate over a copy (`for x in xs[:]`), or iterate by index *backwards* when deleting in place — `for i in range(len(xs) - 1, -1, -1)` — so that deletions do not shift elements you have yet to visit. Assigning `xs[i] = …` during iteration is fine.

## Pitfalls

- `xs = xs.sort()` (or `append`, `reverse`).
- `[[0] * n] * m`.
- `b = a` when a copy was meant; `a.copy()` when a deep copy was meant.
- `pop(0)`/`insert(0, …)` in a loop — use a `deque`.
- `x in xs` inside a loop over another list — quadratic; use a set.
- `xs.remove(x)` inside `for x in xs`.

## Key takeaways

- Lists are mutable, ordered, heterogeneous; `list(iterable)` copies, `[x] * n` repeats references.
- `append`/`pop()` are O(1); `insert`/`pop(i)`/`remove`/`in` are O(n); in-place methods return `None`.
- `b = a` aliases; `a.copy()`/`list(a)`/`a[:]` copy shallowly; `copy.deepcopy` copies nested structure.
- `[[0] * n for _ in range(m)]` for a grid — never `[[0] * n] * m`.
- Never change a list's length while iterating it; build a new list or iterate a copy.
