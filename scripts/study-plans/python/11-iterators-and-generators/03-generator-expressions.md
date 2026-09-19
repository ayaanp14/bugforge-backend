---
title: Generator expressions — lazy comprehensions
minutes: 12
---
A generator expression is a comprehension in parentheses that produces a generator instead of a list: `(x * x for x in xs)`. It is the same lazy machinery as a generator function, written inline for the one-line cases — the argument to `sum`, `max`, `any`, `all`, `"".join`, `sorted`, `set`, `dict`, or a `for` loop. Choosing it over a list comprehension is a memory decision (O(1) instead of O(n)) and sometimes a time decision (short-circuit consumers stop early). This lesson covers the syntax and its one-shot nature, when it beats a list comprehension and when it does not, the short-circuit consumers, the `next(gen, default)` idiom, and the scoping detail that makes the first `for` clause evaluate eagerly.

## The syntax

```python
squares = (x * x for x in range(5))     # a generator object; nothing computed yet
type(squares)                            # <class 'generator'>
list(squares)                            # [0, 1, 4, 9, 16]
list(squares)                            # [] — one-shot, like every generator

total = sum(x * x for x in range(5))     # the parentheses of the call are enough
big = sum((x for x in xs), start=0)      # with a second argument, the generator needs its own parentheses
```

Everything a list comprehension can express — a filtering `if`, nested `for` clauses, a conditional expression — works identically. The only difference is that the result is produced lazily and cannot be indexed, sliced, measured with `len` or iterated twice.

## Generator versus list comprehension

| Situation | Use |
| --- | --- |
| Feeding a single consumer once (`sum`, `max`, `any`, `join`, `for`) | generator expression |
| The values are needed more than once, indexed, sliced or `len`-ed | list comprehension |
| The data is large or the source is itself lazy (a file, another generator) | generator expression |
| The consumer may stop early (`any`, `all`, `next`, `in`) | generator expression — work stops at the answer |
| You want to print or debug the intermediate values | list comprehension (a generator shows as `<generator object …>`) |

```python
sum([x * x for x in range(10 ** 6)])     # builds a million-element list, then sums it
sum(x * x for x in range(10 ** 6))       # sums as it goes; constant memory
```

For `sum` and friends the generator is usually also faster, because no list is allocated and grown. For `sorted` and `set`, which must see everything, a list comprehension and a generator expression cost about the same — the generator saves memory, not time.

## Short-circuit consumers

`any`, `all`, `in` (on a generator) and `next` stop at the first value that decides the answer, and a generator expression feeds them exactly as many values as they need:

```python
any(x < 0 for x in xs)                   # stops at the first negative
all(len(w) < 10 for w in words)          # stops at the first long word
next((x for x in xs if x % 7 == 0), None)   # the first multiple of 7, or None
first_long = next((w for w in words if len(w) > 8), "")
```

With a list comprehension, `any([x < 0 for x in xs])` computes every element before `any` looks at the first. The generator version is the idiom for "does one exist?" and "give me the first that…", and `next(gen, default)` is how "first that…" handles the case where nothing matches.

## In other calls

```python
", ".join(str(n) for n in nums)          # join needs strings; the generator converts lazily
max(words, key=len)                      # not a generator: a key function
dict((k, len(k)) for k in keys)          # a dict from pairs; the dict comprehension {k: len(k) for k in keys} is clearer
set(w.lower() for w in words)            # a set; {w.lower() for w in words} is clearer
sorted(x for x in xs if x)               # fine: sorted materialises anyway
tuple(x for x in xs)                     # there is no tuple comprehension; this is it
```

When a set, dict or list is the *goal*, use the matching comprehension; when the goal is a *computation over* the values, pass a generator expression to it.

## The eager first clause

The iterable of the *first* `for` clause is evaluated immediately, when the generator expression is created; everything else is evaluated lazily as values are pulled:

```python
def source():
    print("source evaluated")
    return [1, 2, 3]

g = (x for x in source())                # prints "source evaluated" now
values = list(g)                          # the loop body runs here
```

This means an error in the first iterable surfaces at creation, and that later clauses (`for y in f(x)`) run lazily. It also means a generator expression captures its outer variables by reference, like a lambda — the late-binding trap of Module 4 applies to a generator created in a loop and consumed later.

## Nesting and readability

A generator expression inside another call inside another call is hard to read; give the inner one a name:

```python
lengths = (len(line) for line in lines)
print(f"longest: {max(lengths)}")
```

Two clauses is fine; three, or a conditional expression plus a filter, wants a generator *function* with a name and a docstring.

## Pitfalls

- Iterating a generator expression twice.
- `len(gen)`, `gen[0]`, `gen[:3]` — `TypeError`.
- `sum([... for ...])` when a generator would do.
- `any([...])` losing the short-circuit.
- Printing a generator expression and seeing `<generator object>`.
- A generator expression capturing a loop variable that changes before it is consumed.

## Key takeaways

- `(expr for x in it if cond)` is a lazy, one-shot comprehension; the call's parentheses suffice when it is the only argument.
- Use it to feed `sum`, `max`, `any`, `all`, `join`, `next` and `for`; use a list comprehension when values are reused, indexed or measured.
- `any`/`all`/`next` short-circuit, so a generator does only the work the answer needs; `next(gen, default)` is "first that…".
- The first `for` iterable is evaluated at creation; the rest lazily; outer names are captured by reference.
- Prefer the set/dict comprehension when a set or dict is the goal; name a generator expression when it gets long.
