---
title: The iteration protocol — iter, next and StopIteration
minutes: 13
---
Every `for` loop, comprehension, `sum`, `list()` and `zip` in Python runs on one small protocol: ask an object for an *iterator* with `iter()`, call `next()` on it until it raises `StopIteration`. Understanding that protocol explains why a file can be looped over only once, why `zip` and `enumerate` are lazy, why `range` can be iterated twice but `map(...)` cannot, and how to write a class that `for` understands. This lesson defines iterable and iterator precisely, desugars the `for` loop, shows the built-in iterators and what exhaustion means, writes an iterator class by hand, and covers the two-argument `iter(callable, sentinel)` form.

## Iterable versus iterator

- An **iterable** is anything `iter()` accepts: it has `__iter__` (returning an iterator) or `__getitem__` with integer indexes. Lists, strings, dicts, sets, ranges, files, generators.
- An **iterator** is the object that produces the values: it has `__next__` (returning the next value or raising `StopIteration`) and `__iter__` returning itself, so that an iterator is also an iterable.

```python
xs = [1, 2, 3]
it = iter(xs)          # a list_iterator
next(it)               # 1
next(it)               # 2
next(it)               # 3
next(it)               # StopIteration
next(it, "done")       # 'done' — a default instead of the exception
```

A list is iterable but not an iterator: `next(xs)` is `TypeError: 'list' object is not an iterator`. Calling `iter(xs)` again gives a *fresh* iterator starting at the beginning; the list can be looped over any number of times. The iterator itself is one-shot: once it has raised `StopIteration`, it raises it forever.

## The for loop, desugared

```python
for x in xs:
    body(x)

# is exactly:
_it = iter(xs)
while True:
    try:
        x = next(_it)
    except StopIteration:
        break
    body(x)
```

So `for` calls `iter()` once and `next()` per iteration, and stops on `StopIteration`. Every other consumer — `list(xs)`, `sum(xs)`, `"".join(xs)`, `max(xs)`, `x in xs` without `__contains__`, unpacking `a, b = xs` — does the same. That is why the protocol is the *only* thing a class needs to implement to work everywhere.

## Lazy built-ins

`zip`, `enumerate`, `map`, `filter`, `reversed`, `range` iterators, dict views' iterators, file objects and generators all produce values on demand and are **iterators** (or produce one), not lists:

```python
pairs = zip([1, 2], "ab")
list(pairs)            # [(1, 'a'), (2, 'b')]
list(pairs)            # [] — exhausted; zip returned a one-shot iterator

r = range(3)
list(r), list(r)       # [0, 1, 2] twice — range is an iterable, iter(r) makes a fresh iterator each time

with open(path) as f:
    lines = list(f)    # a file is its own iterator: after this it is at the end
    more = list(f)     # []
```

The practical rule: if you need to go over the values twice, materialise them (`list(...)`) or make sure you have an iterable rather than an iterator. `itertools.tee` splits an iterator into several (Module 11 lesson 4), at the cost of buffering.

## Writing an iterator class

```python
class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self                         # an iterator returns itself

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1

list(Countdown(3))          # [3, 2, 1]
c = Countdown(2)
list(c), list(c)            # [2, 1], [] — one-shot, like every iterator
```

The state lives in the object; `__next__` advances it and raises when done. To make a *re-iterable* container, give the container an `__iter__` that returns a *new* iterator each time — a separate class, or (next lesson) a generator, which is what almost every real `__iter__` is:

```python
class Playlist:
    def __init__(self, tracks):
        self._tracks = list(tracks)

    def __iter__(self):
        return iter(self._tracks)           # a fresh iterator per loop
```

## iter with a sentinel

`iter(callable, sentinel)` calls `callable()` repeatedly until it returns `sentinel`:

```python
with open(path, "rb") as f:
    for chunk in iter(lambda: f.read(4096), b""):
        process(chunk)

for line in iter(input, "END"):           # read until a line equals "END"
    handle(line)
```

The second form is the cleanest "read until sentinel" loop in the language — no `while True`, no `break`.

## The protocol elsewhere

`in` falls back on iteration when there is no `__contains__`; `reversed` needs `__reversed__` or the sequence protocol; `len` is *not* part of iteration — an iterator has no length, which is why `len(zip(...))` is a `TypeError` and why `sum(1 for _ in it)` is how you count one. Unpacking `a, *rest = it` consumes the iterator entirely. `bool(it)` is always `True` for an iterator — emptiness cannot be tested without consuming.

## Pitfalls

- Iterating an iterator twice and getting nothing the second time.
- `len()` on an iterator.
- `next()` on an iterable (a list) instead of `iter(list)`.
- A `__next__` that never raises `StopIteration` — every loop over it is infinite.
- Testing `if it:` for emptiness.
- Returning a list from `__iter__` (must be an iterator; `iter(list)` fixes it).

## Key takeaways

- Iterable: has `__iter__` (or `__getitem__`); iterator: has `__next__` and `__iter__` returning itself; `for` calls `iter()` once and `next()` until `StopIteration`.
- Iterators are one-shot; containers give a fresh iterator each time; `zip`, `map`, files and generators are one-shot iterators.
- Write `__next__` to advance state and raise `StopIteration` when done; give a container an `__iter__` that returns a new iterator.
- `next(it, default)` avoids the exception; `iter(callable, sentinel)` loops until a value.
- Iterators have no `len`, no emptiness test and cannot be rewound — materialise when you need those.
