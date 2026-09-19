---
title: Sets — membership, deduplication and set algebra
minutes: 13
---
A set is an unordered collection of distinct hashable objects with constant-time membership. That single property — `x in s` is O(1) regardless of size — turns quadratic "is this element in that list" loops into linear ones, and the set operations (union, intersection, difference) express "in both", "in either", "in one but not the other" without loops at all. This lesson covers construction, the mutating and non-mutating operations, `frozenset`, the ordering caveat that decides how a set is printed, and the recipes: deduplicate (with and without order), find duplicates, compare two collections.

## Building

```python
s = {1, 2, 3}
empty = set()              # {} is an empty *dict*
from_list = set([1, 2, 2, 3])          # {1, 2, 3} — duplicates collapse
from_str = set("hello")                # {'h', 'e', 'l', 'o'}
evens = {x for x in range(10) if x % 2 == 0}   # set comprehension
```

Elements must be hashable: numbers, strings, tuples of hashables, frozensets — not lists, dicts or sets. `{[1, 2]}` is `TypeError: unhashable type: 'list'`; a tuple `(1, 2)` works, so pairs, coordinates and visited-cell records are tuples in a set.

## Membership and size

```python
3 in s              # True — O(1) average
len(s)              # 3
```

The classic upgrade is a loop that tests `x in some_list` for many `x`: converting the list to a set once makes every test constant time. `seen = set()` with `if x in seen: … seen.add(x)` is the visited-set idiom of every graph search.

## Changing a set

```python
s.add(4)            # insert (no effect if present)
s.remove(4)         # KeyError if absent
s.discard(4)        # no error if absent
s.pop()             # remove and return an arbitrary element
s.clear()
s.update([5, 6])    # add many
```

`discard` is the one to use when absence is normal; `remove` when absence is a bug.

## Set algebra

| Operation | Operator | Method | Meaning |
| --- | --- | --- | --- |
| union | `a \| b` | `a.union(b)` | in either |
| intersection | `a & b` | `a.intersection(b)` | in both |
| difference | `a - b` | `a.difference(b)` | in `a` but not `b` |
| symmetric difference | `a ^ b` | `a.symmetric_difference(b)` | in exactly one |
| subset | `a <= b`, `a < b` | `a.issubset(b)` | every element of `a` is in `b` (strict with `<`) |
| superset | `a >= b`, `a > b` | `a.issuperset(b)` | |
| disjoint | — | `a.isdisjoint(b)` | no common element |

```python
a = {1, 2, 3}
b = {3, 4}
a | b          # {1, 2, 3, 4}
a & b          # {3}
a - b          # {1, 2}
a ^ b          # {1, 2, 4}
a |= b         # update a in place; &=, -=, ^= likewise
```

The operators require both sides to be sets; the methods accept any iterable (`a.union([4, 5])`). The in-place forms (`|=`, `intersection_update`, …) modify the left set. `a - b` is the "what is missing" question, `a & b` the "what do they share" question, `a ^ b` the "what changed" question between two snapshots.

## frozenset

An immutable set — hashable, so usable as a dict key or a member of another set:

```python
fs = frozenset({1, 2})
groups = {frozenset({"a", "b"}): "pair"}      # a key that is a set of names
seen_states = {frozenset(state) for state in states}
```

It supports every non-mutating operation. Use it whenever a set must go into another set or serve as a key; a plain set there is a `TypeError`.

## Order: the caveat that matters for output

A set has no order, and the order it iterates in depends on the elements' hashes, which for strings are **randomised per process** (`PYTHONHASHSEED`). `print({"b", "a"})` may show `{'a', 'b'}` on one run and `{'b', 'a'}` on the next. Two rules follow:

1. **Never print a set, and never build output by iterating one.** Sort it: `sorted(s)` gives a list in a defined order, and `" ".join(sorted(s))` is the line to print.
2. **Never depend on which element `s.pop()` or `next(iter(s))` returns**, or on the order of `list(s)`.

Small integers happen to iterate in ascending order in CPython, which is an implementation accident, not a guarantee; sort those too.

## Recipes

```python
unique_count = len(set(xs))                          # how many distinct
unique_ordered = list(dict.fromkeys(xs))             # deduplicate, keeping first occurrence
duplicates = {x for x in xs if xs.count(x) > 1}      # O(n²) — fine for small n
seen, dups = set(), set()                            # O(n)
for x in xs:
    if x in seen:
        dups.add(x)
    seen.add(x)
missing = set(range(1, n + 1)) - set(xs)             # which of 1..n are absent
common = set(a) & set(b)                             # shared elements of two lists
same_elements = set(a) == set(b)                     # ignoring order and repeats
```

`dict.fromkeys(xs)` is the ordered deduplication: dict keys are unique *and* keep insertion order, so the keys of that dict are the distinct elements in first-seen order — the one thing a set cannot give you.

## Pitfalls

- `{}` for an empty set.
- A list or a set as an element; use a tuple or `frozenset`.
- Printing a set, or joining its elements without sorting.
- `remove` on a possibly-absent element; `discard`.
- `a | [1, 2]` — the operator needs two sets; use `a.union([1, 2])`.
- Expecting `set(xs)` to preserve order; `dict.fromkeys(xs)`.

## Key takeaways

- A set holds distinct hashable elements with O(1) membership; build with `{…}`, `set(iterable)` or a comprehension; `set()` is the empty one.
- `add`/`discard`/`remove`/`update`; `|`, `&`, `-`, `^` and their in-place forms; `<=`/`>=` for subsets; methods accept any iterable.
- `frozenset` is the immutable, hashable set for keys and nested sets.
- Iteration order is arbitrary and randomised for strings — sort before printing, never depend on it.
- Deduplicate with `set` (unordered) or `dict.fromkeys` (ordered); find missing and common elements with `-` and `&`.
