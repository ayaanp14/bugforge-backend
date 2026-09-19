---
title: Sorting — sort, sorted, keys, stability and bisect
minutes: 13
---
Python sorts with one algorithm — Timsort, a stable merge sort tuned for runs that already exist in the data — behind two calls: `list.sort()` in place and `sorted()` returning a new list. Every ordering question reduces to choosing a *key function*, which is why the previous module's key idiom matters here, and stability is what makes multi-pass and multi-key sorting predictable. This lesson gives the two calls, the key recipes (tuples, negation, case-insensitivity, `itemgetter`), the stability guarantee and what it buys, `bisect` for keeping a sorted list sorted, and the reasons `cmp_to_key` is rarely needed.

## sort versus sorted

```python
xs = [3, 1, 2]
ys = sorted(xs)      # [1, 2, 3]; xs unchanged; works on any iterable, always returns a list
xs.sort()            # xs is now [1, 2, 3]; returns None
sorted("bca")        # ['a', 'b', 'c'] — from a string, a list comes back
sorted({3: "a", 1: "b"})   # [1, 3] — the keys
```

Use `sorted` when the original must survive or the input is not a list; use `sort` when the list is yours and the copy would be waste. Both take `key=` and `reverse=`. Elements must be mutually comparable: `sorted([1, "a"])` is a `TypeError`.

## Keys

The key function is called once per element and its result is what gets compared:

```python
words = ["banana", "Apple", "cherry"]
sorted(words, key=str.lower)                    # case-insensitive
sorted(words, key=len)                          # by length; equal lengths keep input order (stable)
sorted(words, key=lambda w: (len(w), w))        # by length, then alphabetically
sorted(nums, key=abs)                           # by magnitude
sorted(people, key=lambda p: (-p.age, p.name))  # age descending, name ascending
sorted(rows, key=itemgetter(2, 0))              # by column 2 then column 0
sorted(items, key=attrgetter("price"))          # by attribute
```

The tuple key is the multi-key sort: tuples compare element by element, so `(len(w), w)` orders by length first and breaks ties alphabetically. Negation reverses a numeric component only; for a string component that must go the other way, use two stable sorts (below) or `reverse=True` on the whole key.

`reverse=True` reverses the *result order* while keeping stability: equal keys still appear in their original relative order, not reversed.

## Stability

A stable sort keeps elements with equal keys in their input order. Timsort is stable, and that guarantee turns into two techniques. First, a sort by a secondary key followed by a sort by the primary key produces a multi-key ordering:

```python
rows.sort(key=itemgetter(1))          # secondary key first
rows.sort(key=itemgetter(0))          # primary key last; ties keep the secondary order
```

That is how you sort by one field descending and another ascending when the tuple trick does not apply (`rows.sort(key=name)` then `rows.sort(key=score, reverse=True)`). Second, `sorted(xs, key=…)` on already-grouped data keeps each group's internal order — useful when the input order is meaningful (arrival order, file order).

## Sorting objects without a key

Tuples, lists and strings compare lexicographically, so `sorted(pairs)` sorts by first element then second without any key — but it also compares the second elements when the first are equal, which is a `TypeError` if those are incomparable (`None`, mixed types). Give a key when the tie-break should not touch the other fields. Your own classes sort once they define `__lt__` (Module 8); dataclasses with `order=True` get it for free.

## min, max and the top k

`min(xs, key=…)` and `max(xs, key=…)` take the same key and return the *first* extreme element on a tie. For the top `k` of `n` elements, `sorted(xs, reverse=True)[:k]` is O(n log n); `heapq.nlargest(k, xs, key=…)` is O(n log k) and is what you want when `k` is small (Module 7 lesson 6).

## bisect: keeping a list sorted

`bisect` finds where a value belongs in a sorted list by binary search, in O(log n):

```python
import bisect
xs = [1, 3, 3, 7]
bisect.bisect_left(xs, 3)     # 1 — first position where 3 could go (before equal elements)
bisect.bisect_right(xs, 3)    # 3 — after equal elements
bisect.insort(xs, 5)          # xs is [1, 3, 3, 5, 7] — insert keeping order (O(n) for the shift)
bisect.bisect_left(xs, 4)     # 3 — where 4 would go: the count of elements < 4
```

`bisect_left` answers "how many elements are less than x" and "is x present" (`i < len(xs) and xs[i] == x`); `bisect_right - bisect_left` counts occurrences. Since 3.10 the functions take `key=`. Grade boundaries, percentile lookups and "first element ≥ x" are all one `bisect` call on a sorted list; a linear scan for the same is O(n) per query.

## cmp_to_key

Older code and other languages sort with a *comparison* function returning negative, zero or positive. Python dropped `cmp=` because keys are faster (one call per element, not per comparison) and clearer. When an ordering genuinely cannot be expressed as a key — comparing strings by a custom rule that depends on both operands — `functools.cmp_to_key(compare)` wraps a comparison function into a key. It is rare; if you reach for it, first check whether a tuple key does the job.

## Pitfalls

- `xs = xs.sort()`.
- `sorted` on mixed types, or a tuple key whose tie-break compares incomparable values.
- `key=lambda w: -w` on strings; use `reverse=True` or two sorts.
- Expecting `reverse=True` to reverse the order of equal elements.
- Linear search in a sorted list where `bisect` is O(log n).
- `sorted(...)[:k]` for a small `k` on a huge list — `heapq.nlargest`.

## Key takeaways

- `sorted(iterable)` returns a new list; `list.sort()` sorts in place and returns `None`; both take `key` and `reverse`.
- A key returning a tuple sorts by several criteria; negate a numeric component to reverse it; `itemgetter`/`attrgetter` build keys.
- Timsort is stable: equal keys keep input order, so successive sorts (secondary then primary) compose.
- `min`/`max` with a key give the first extreme; `heapq.nlargest` for a small top-k.
- `bisect_left`/`bisect_right`/`insort` search and insert in a sorted list in O(log n).
