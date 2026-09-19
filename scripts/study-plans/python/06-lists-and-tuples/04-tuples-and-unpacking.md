---
title: Tuples, unpacking and named tuples
minutes: 13
---
A tuple is an immutable sequence, and that one property makes it the right type for three jobs: a fixed-shape record (`(name, age, city)`), a value returned from a function that has several results, and a key in a dictionary or a member of a set. Python's unpacking syntax — `a, b = pair`, `first, *rest = xs`, the parallel assignment `a, b = b, a` — is what makes tuples pleasant rather than clumsy. This lesson fixes the literal syntax (the comma, not the parentheses), the immutability rule and its one exception, unpacking in all its forms, and `namedtuple` for records whose fields deserve names.

## Literals — it is the comma

```python
point = (3, 4)
point = 3, 4          # the same tuple: the comma makes it, the parentheses group
single = (5,)         # a one-element tuple needs the trailing comma
not_a_tuple = (5)     # just the int 5 in parentheses
empty = ()
from_list = tuple([1, 2, 3])
```

Parentheses are required only where the comma would be ambiguous — inside a function call, a subscript or a larger expression — and by convention for readability. `type((1))` is `int`; `type((1,))` is `tuple`. Everything a string or list can do read-only, a tuple can do: index, slice, `len`, `in`, iterate, `count`, `index`, compare lexicographically, concatenate with `+`, repeat with `*`.

## Immutable, with a caveat

```python
t = (1, 2, 3)
t[0] = 9              # TypeError: 'tuple' object does not support item assignment
t = t + (4,)          # a new tuple; the name rebinds

t = ([1, 2], 3)
t[0].append(9)        # fine — the tuple still holds the same list object, which changed
t[0] = [0]            # TypeError — the *slot* cannot be rebound
```

The tuple's *structure* is fixed: which objects it references, in what order. Whether those objects change is up to them. A tuple of numbers and strings is therefore fully immutable and hashable; a tuple containing a list is neither hashable (`{([1], 2)}` raises `TypeError: unhashable type: 'list'`) nor truly frozen.

## Why tuples

- **Records.** A row from a file, a coordinate, an RGB triple: fixed length, position has meaning. Lists are for collections of *the same kind of thing* with a variable length.
- **Multiple return values.** `return lo, hi` builds a tuple; the caller unpacks it.
- **Dictionary keys and set members.** `seen = {(r, c)}`, `distances[(a, b)]` — a list cannot be a key (Module 7).
- **Safety.** A function receiving a tuple cannot accidentally append to it.
- **Speed and size.** Slightly smaller and faster to build than a list; a constant tuple is built once at compile time.

## Unpacking

```python
a, b = 1, 2                       # parallel assignment
a, b = b, a                       # swap: the right side is built before any name is bound
x, y, z = "xyz"                   # any iterable of the right length
(name, age), city = ("Ada", 36), "London"     # nested
first, *middle, last = [1, 2, 3, 4, 5]        # first=1, middle=[2, 3, 4], last=5
head, *tail = [1]                             # head=1, tail=[]
*init, last = xs
```

The counts must match, or `ValueError: too many values to unpack (expected 2)` / `not enough values`. A starred target absorbs the surplus as a list (possibly empty) and may appear once, anywhere. Unpacking works in every binding position — `for k, v in d.items()`, `for i, (a, b) in enumerate(pairs)`, `lambda p: p[0]` versus `def f(p): x, y = p`, and in function calls as `f(*args)`.

The swap works because the right-hand tuple is fully evaluated first; `xs[i], xs[j] = xs[j], xs[i]` swaps list elements in one line for the same reason.

## Ignoring values

`_` is the conventional name for a value you do not need: `for _ in range(3)`, `name, _, city = row`, `*_, last = xs`. It is an ordinary name and nothing stops you reading it; the convention is for the reader.

## Named tuples

A tuple whose fields have names, with the tuple's size and immutability and a readable `repr`:

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
p.x, p[0]                 # 3, 3 — by name or by position
x, y = p                  # still unpacks
p._replace(x=0)           # a new Point(0, 4)
p._asdict()               # {'x': 3, 'y': 4}
Point._fields             # ('x', 'y')
print(p)                  # Point(x=3, y=4)
```

`typing.NamedTuple` is the class-syntax version with type hints:

```python
from typing import NamedTuple

class Point(NamedTuple):
    x: int
    y: int = 0

    def norm(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5
```

Named tuples are the lightest way to give a record a shape; when you need mutability, defaults with factories or methods that change state, Module 8's `dataclass` is the next step up.

## Pitfalls

- `(5)` when `(5,)` was meant.
- Assuming a tuple with a list inside is hashable or frozen.
- Unpacking a row with the wrong number of fields — the `ValueError` is the input validation.
- Using a list for a fixed record (`row[2]` with no meaning) where a named tuple would document the fields.
- Writing `return (a, b)` and `x = f()[0]` when unpacking would be clearer.
- Two starred targets in one unpacking (a syntax error).

## Key takeaways

- The comma makes a tuple; `(5,)` is a one-tuple, `(5)` is an int.
- Tuples fix their structure, not their contents; a tuple of immutables is hashable and a valid dict key.
- Use tuples for fixed-shape records, multiple returns and keys; lists for variable collections of like items.
- `a, b = b, a`, `first, *rest = xs`, nested targets, and unpacking in `for` and calls; counts must match.
- `namedtuple`/`NamedTuple` add field names, `_replace` and `_asdict` to a tuple; `dataclass` is the mutable step up.
