---
title: Dunder methods — making a class behave like a built-in
minutes: 15
---
Every operator and built-in function in Python is a call to a *dunder* (double-underscore) method: `a + b` is `a.__add__(b)`, `len(x)` is `x.__len__()`, `x in c` is `c.__contains__(x)`, `print(x)` is `x.__str__()`. Define the method and your class gets the operator; this is the *data model*, and it is why a user-defined type can be as pleasant to use as a list or an int. This lesson covers the dunders that matter first — representation, equality and ordering, size and containment, iteration, arithmetic, truth and calling — with the conventions (`NotImplemented`, `total_ordering`, reflected operators) that make them behave correctly.

## Representation

```python
class Money:
    def __init__(self, cents, currency="GBP"):
        self.cents, self.currency = cents, currency

    def __repr__(self):                     # unambiguous, for developers
        return f"Money({self.cents}, {self.currency!r})"

    def __str__(self):                      # readable, for users
        return f"{self.cents // 100}.{self.cents % 100:02d} {self.currency}"

m = Money(1250)
repr(m)        # "Money(1250, 'GBP')"
str(m)         # '12.50 GBP'
print(m)       # 12.50 GBP       — print uses __str__
print([m])     # [Money(1250, 'GBP')] — containers use __repr__
f"{m}"         # str;  f"{m!r}" for repr
```

If only `__repr__` is defined, `str` falls back to it, so `__repr__` alone is enough for most classes; add `__str__` when the user-facing text should differ. `__format__(self, spec)` lets `f"{m:>12}"` work with a custom spec.

## Equality and hashing

```python
    def __eq__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return (self.cents, self.currency) == (other.cents, other.currency)

    def __hash__(self):
        return hash((self.cents, self.currency))
```

Without `__eq__`, `==` is identity. Returning `NotImplemented` (not `False`) for a foreign type lets Python try `other.__eq__(self)` and then fall back to identity, so `Money(1) == 5` is `False` without an error. `__ne__` is derived automatically. Defining `__eq__` makes the class unhashable unless `__hash__` is also defined (Module 7 lesson 4) — define it over the same fields, or leave the class unhashable deliberately if it is mutable.

## Ordering

```python
from functools import total_ordering

@total_ordering
class Money:
    ...
    def __lt__(self, other):
        if not isinstance(other, Money) or other.currency != self.currency:
            return NotImplemented
        return self.cents < other.cents
```

`__lt__` alone makes `sorted`, `min` and `max` work (they only use `<`). `@total_ordering` derives `__le__`, `__gt__`, `__ge__` from `__lt__` plus `__eq__`, so you write two and get six. The comparison dunders should return `NotImplemented` for types they cannot order; Python then raises `TypeError` with a clear message.

## Size, containment, indexing, iteration

```python
class Playlist:
    def __init__(self, tracks):
        self._tracks = list(tracks)

    def __len__(self):                  # len(p)
        return len(self._tracks)

    def __contains__(self, track):      # track in p
        return track in self._tracks

    def __getitem__(self, i):           # p[i], p[1:3]; iteration falls back on this
        return self._tracks[i]

    def __iter__(self):                 # for t in p — preferred over the __getitem__ fallback
        return iter(self._tracks)

    def __bool__(self):                 # if p:   — without it, __len__ decides truthiness
        return bool(self._tracks)
```

`__len__` makes `len()` work and, absent `__bool__`, makes an empty object falsy. `__getitem__` receiving a `slice` object is what makes `p[1:3]` work — delegating to the inner list handles it. `__iter__` should return an iterator (`iter(self._tracks)`, or a generator with `yield`, Module 11); `__reversed__`, `__setitem__` and `__delitem__` complete the mutable-sequence set.

## Arithmetic

```python
    def __add__(self, other):                       # self + other
        if not isinstance(other, Money) or other.currency != self.currency:
            return NotImplemented
        return Money(self.cents + other.cents, self.currency)

    def __mul__(self, factor):                      # self * 3
        if not isinstance(factor, int):
            return NotImplemented
        return Money(self.cents * factor, self.currency)

    def __rmul__(self, factor):                     # 3 * self — the reflected form
        return self * factor

    def __neg__(self):                              # -self
        return Money(-self.cents, self.currency)
```

For `a + b` Python calls `a.__add__(b)`; if that returns `NotImplemented` it tries `b.__radd__(a)`. That is how `3 * money` works: `int.__mul__` does not know `Money`, so `Money.__rmul__` is tried. Arithmetic dunders should return a *new* object and leave the operands alone; `__iadd__` (for `+=`) may mutate in place and must return `self`. `sum(monies, Money(0))` works once `__add__` exists — the start value matters because `sum` begins from `0`.

## Calling and the rest

`__call__(self, *args)` makes an instance callable (`counter()`), which is how a class becomes a function with state. `__enter__`/`__exit__` make it a context manager (Module 10). `__getattr__` intercepts missing attributes (Module 16). A summary of the ones to know:

| Expression | Method | Expression | Method |
| --- | --- | --- | --- |
| `repr(x)`, `str(x)` | `__repr__`, `__str__` | `x + y`, `x * y` | `__add__`, `__mul__` (+ `__r…__`) |
| `x == y`, `x < y` | `__eq__`, `__lt__` | `-x`, `abs(x)` | `__neg__`, `__abs__` |
| `hash(x)` | `__hash__` | `x += y` | `__iadd__` |
| `len(x)`, `bool(x)` | `__len__`, `__bool__` | `x()` | `__call__` |
| `x[i]`, `x[i] = v` | `__getitem__`, `__setitem__` | `with x:` | `__enter__`, `__exit__` |
| `for e in x` | `__iter__` | `int(x)`, `float(x)` | `__int__`, `__float__` |
| `e in x` | `__contains__` | `x.missing` | `__getattr__` |

## Pitfalls

- Returning `False` instead of `NotImplemented` for a foreign type in `__eq__`/`__lt__`/`__add__`.
- `__eq__` without `__hash__` on a class meant to be a key.
- Mutating `self` in `__add__`; that is `__iadd__`'s job.
- `__str__` without `__repr__` — containers still show the ugly default.
- Forgetting `__rmul__`, so `3 * m` fails while `m * 3` works.
- A `__len__` that can be zero on an object that should be truthy — add `__bool__`.

## Key takeaways

- Operators and built-ins dispatch to dunders; define them and the class gains the syntax.
- `__repr__` looks like the constructor; `__str__` is the readable form; containers use `repr`.
- `__eq__` + `__hash__` over the same fields; `__lt__` + `@total_ordering` for the rest; return `NotImplemented` for foreign types.
- `__len__`, `__contains__`, `__getitem__`, `__iter__`, `__bool__` make a collection type; `__getitem__` alone gives iteration.
- Binary dunders return new objects; `__r…__` handles the reflected call; `__iadd__` mutates and returns `self`.
