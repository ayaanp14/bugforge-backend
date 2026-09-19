---
title: For loops, range, enumerate and zip
minutes: 14
---
Python's `for` is a *for-each*: it takes an iterable — a list, a string, a range, a dictionary, a file, a generator — and binds the loop variable to each element in turn. There is no index unless you ask for one, and asking is done with `enumerate`; walking two sequences together is `zip`; counting is `range`. Learners from C write `for i in range(len(xs)): x = xs[i]`, which works and marks them as learners. This lesson fixes the idioms, explains `range` precisely, and states the one rule about modifying a collection while iterating over it.

## The statement

```python
for ch in "abc":
    print(ch)

for name in ["ada", "grace"]:
    print(name.title())

for key in {"a": 1, "b": 2}:          # a dict iterates its keys
    print(key)
```

The loop variable is an ordinary name bound in the enclosing scope; it keeps its last value after the loop (`for i in range(3): pass; print(i)` prints `2`), and rebinding it inside the body does not affect the iteration — the next value comes from the iterable, not from the variable. `break`, `continue` and `else` work exactly as in `while`: `else` runs when the iterable is exhausted without a `break`.

```python
for x in xs:
    if x < 0:
        print("has a negative")
        break
else:
    print("all non-negative")
```

## range

`range(stop)`, `range(start, stop)`, `range(start, stop, step)` — half-open, like slicing: `start` included, `stop` excluded.

```python
list(range(5))            # [0, 1, 2, 3, 4]
list(range(2, 5))         # [2, 3, 4]
list(range(0, 10, 3))     # [0, 3, 6, 9]
list(range(5, 0, -1))     # [5, 4, 3, 2, 1]
list(range(3, 3))         # []
```

Half-open ranges compose: `range(0, n)` then `range(n, m)` cover `0 … m-1` exactly once; the count of elements is `stop - start` for step 1; `range(len(xs))` is exactly the valid indices. A `range` is not a list — it is a small object that computes elements on demand, so `range(10 ** 9)` costs nothing until iterated, and `5 in range(0, 100, 5)` is answered arithmetically. Counting down is `range(n - 1, -1, -1)`, or `reversed(range(n))`, which reads better.

The loop `for _ in range(n):` is the idiom for "n times, the number does not matter"; the underscore is a convention meaning "unused".

## enumerate: index and element

```python
for i, name in enumerate(names):          # 0-based
    print(i, name)

for i, name in enumerate(names, start=1): # 1-based, for display
    print(f"{i}. {name}")
```

`enumerate` yields `(index, element)` pairs, unpacked into two names by the `for`. Reach for it whenever the body needs the position — to print a line number, to compare with a neighbour `xs[i + 1]`, to record where a match was found. `for i in range(len(xs))` is the older spelling and is right only when the body needs the index *and not* the element, or must write `xs[i] = …`.

## zip: parallel sequences

```python
for name, score in zip(names, scores):
    print(f"{name}: {score}")

for i, (name, score) in enumerate(zip(names, scores), start=1):
    ...
```

`zip` stops at the *shortest* input, silently; `zip(a, b, strict=True)` (3.10) raises `ValueError` on a length mismatch, which is what you want when the sequences are supposed to correspond. `dict(zip(keys, values))` builds a mapping from two lists; `zip(*grid)` transposes a list of rows into columns (Module 6). `itertools.zip_longest` pads the shorter one instead of truncating.

## Iterating dictionaries

`for k in d` gives keys; `for v in d.values()` values; `for k, v in d.items()` both. Insertion order is preserved (since 3.7), so a dictionary iterates in the order its keys were added. `for k in sorted(d)` iterates the keys in sorted order.

## Nested loops

```python
for r in range(rows):
    for c in range(cols):
        visit(r, c)
```

Leaving both loops at once has no `break 2`. The options: put the loops in a function and `return`; set a flag and test it in the outer loop; or iterate the pairs with `itertools.product(range(rows), range(cols))`, which makes it one loop with one `break`. The function is the cleanest when the search *is* a unit of work.

## Modifying while iterating

Do not add to or remove from a list, dict or set while a `for` loop is iterating over it. Removing shifts the elements and the loop skips one; adding can make it infinite; a dict raises `RuntimeError: dictionary changed size during iteration`. The fixes are to iterate over a copy (`for x in list(xs):`), to build a new collection (`kept = [x for x in xs if keep(x)]` — the comprehension is almost always what you meant), or to collect the changes and apply them after the loop. Modifying *elements in place* (`xs[i] = …`) is fine.

## Pitfalls

- `for i in range(len(xs)): x = xs[i]` where `for x in xs` or `enumerate` was meant.
- `range(1, n)` when `n` should be included: the stop is excluded.
- `zip` truncating silently when the lists should have matched — `strict=True`.
- `xs.remove(x)` inside `for x in xs`.
- Expecting a `for` loop to have its own scope; the loop variable and everything assigned in the body are visible after it.
- `for k, v in d:` — iterating a dict gives keys; `.items()` gives pairs.

## Key takeaways

- `for` iterates the elements of any iterable; `break`, `continue`, `else` as with `while`.
- `range(start, stop, step)` is half-open and lazy; `range(len(xs))` is the valid indices; `for _ in range(n)` repeats.
- `enumerate` for index and element, `zip` for parallel sequences (`strict=True` to check lengths), `.items()` for dict pairs.
- Leave nested loops with a function `return` or `itertools.product`.
- Never change a collection's size while iterating it; iterate a copy or build a new one.
