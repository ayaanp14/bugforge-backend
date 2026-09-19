---
title: The data model — the rest of the dunders, and a Vector that uses them
minutes: 14
---
Module 8 covered the dunders a value type needs first. This lesson completes the map: `__call__`, `__format__`, `__index__`, `__bool__`, `__contains__`, the in-place operators (`__iadd__`), unary and reflected arithmetic, `__matmul__`, `__missing__` for dict subclasses, `__reversed__`, `__del__` and why it cannot be relied on, and the dispatch rules — `NotImplemented`, reflected fallbacks, subclass priority — that make mixed-type operations work. It ends with a `Vector` class that exercises most of them, as the checkpoint will.

## Calling, formatting, converting

```python
class Multiplier:
    def __init__(self, k):
        self.k = k
    def __call__(self, x):                  # obj(x)
        return self.k * x

class Money:
    def __format__(self, spec):             # f"{m:>10}" — spec is what follows the colon
        text = f"{self.cents / 100:.2f}"
        return format(text, spec)
    def __bool__(self):                     # truthiness; without it, __len__; without that, always True
        return self.cents != 0
    def __int__(self): return self.cents // 100
    def __float__(self): return self.cents / 100
    def __index__(self): return self.cents  # lets the object be used as a slice index or in bin(); implies __int__
```

`__call__` makes instances callable — stateful callables, decorator classes, strategy objects. `__format__` receives the format spec and returns the formatted text; the default delegates to `__str__` and ignores the spec. `__index__` is the "this is really an integer" hook: `range`, slicing, `bin` and `hex` accept anything that defines it.

## Arithmetic: forward, reflected, in-place

For `a + b`, Python tries `a.__add__(b)`; if that returns `NotImplemented`, it tries `b.__radd__(a)`; if both fail, `TypeError`. One exception: if `type(b)` is a *subclass* of `type(a)` and overrides `__radd__`, the reflected method is tried first, so a subclass can specialise mixed operations. `a += b` tries `a.__iadd__(b)` and falls back to `a = a + b`; an `__iadd__` mutates and must `return self`.

| Operator | Forward | Reflected | In-place |
| --- | --- | --- | --- |
| `+` `-` `*` `/` `//` `%` `**` | `__add__` … `__pow__` | `__radd__` … `__rpow__` | `__iadd__` … `__ipow__` |
| `@` | `__matmul__` | `__rmatmul__` | `__imatmul__` |
| `&` `\|` `^` `<<` `>>` | `__and__` … `__rshift__` | `__rand__` … | `__iand__` … |
| `-x` `+x` `abs(x)` `~x` | `__neg__` `__pos__` `__abs__` `__invert__` | | |
| `round(x, n)` `math.floor(x)` | `__round__` `__floor__` `__ceil__` `__trunc__` | | |
| `divmod(a, b)` | `__divmod__` | `__rdivmod__` | |

Return `NotImplemented` (the singleton, not the exception) for operands you do not handle; never raise `TypeError` yourself, or the reflected attempt is skipped.

## Containers

```python
class Grid:
    def __getitem__(self, key):             # key may be an int, a slice, or a tuple for g[r, c]
        if isinstance(key, tuple):
            r, c = key
            return self._cells[r][c]
        return self._cells[key]
    def __setitem__(self, key, value): ...
    def __delitem__(self, key): ...
    def __contains__(self, value): ...       # in; falls back on iteration
    def __reversed__(self): ...              # reversed(); falls back on __len__ + __getitem__
    def __len__(self): ...
    def __iter__(self): ...

class Defaults(dict):
    def __missing__(self, key):             # called by dict.__getitem__ for an absent key
        return f"<{key}>"
```

`g[1, 2]` passes the tuple `(1, 2)` as one key — the syntax NumPy uses. `__missing__` is the hook `defaultdict` is built on: `dict[key]` calls it instead of raising; `get`, `in` and `setdefault` do not.

## Object lifetime

`__del__` runs when the reference count reaches zero — usually promptly in CPython, never guaranteed (cycles, interpreter shutdown, other implementations), and exceptions in it are printed and ignored. It is not a destructor to rely on: resources are released by `with` and `close()`, not by `__del__`. `weakref.finalize` is the reliable way to attach cleanup to an object's collection when you must.

## A Vector

```python
import math

class Vector:
    __slots__ = ("_xs",)

    def __init__(self, *xs):
        self._xs = tuple(float(x) for x in xs)

    def __repr__(self):
        return f"Vector({', '.join(f'{x:g}' for x in self._xs)})"

    def __len__(self):
        return len(self._xs)

    def __iter__(self):
        return iter(self._xs)

    def __getitem__(self, i):
        result = self._xs[i]
        return Vector(*result) if isinstance(i, slice) else result

    def __eq__(self, other):
        return isinstance(other, Vector) and self._xs == other._xs

    def __hash__(self):
        return hash(self._xs)

    def __bool__(self):
        return any(self._xs)

    def __abs__(self):
        return math.hypot(*self._xs)

    def __neg__(self):
        return Vector(*(-x for x in self._xs))

    def __add__(self, other):
        if not isinstance(other, Vector) or len(other) != len(self):
            return NotImplemented
        return Vector(*(a + b for a, b in zip(self, other)))

    def __mul__(self, k):                     # scalar
        if not isinstance(k, (int, float)):
            return NotImplemented
        return Vector(*(x * k for x in self._xs))

    __rmul__ = __mul__                        # 3 * v

    def __matmul__(self, other):              # dot product
        if not isinstance(other, Vector) or len(other) != len(self):
            return NotImplemented
        return sum(a * b for a, b in zip(self, other))

    def __format__(self, spec):
        return f"({', '.join(format(x, spec) for x in self._xs)})"
```

`Vector(1, 2) + Vector(3, 4)`, `3 * v`, `v @ w`, `abs(v)`, `-v`, `v[0]`, `v[1:]`, `len(v)`, `list(v)`, `bool(Vector(0, 0))`, `{v}`, `f"{v:.1f}"` — each is one dunder, and together they make the class feel built in. `__slots__` keeps instances small; `__eq__` with `__hash__` makes them set members; every binary operator returns `NotImplemented` for foreign types.

## Pitfalls

- Raising `TypeError` instead of returning `NotImplemented`.
- `__iadd__` that mutates but forgets `return self`.
- `__format__` ignoring the spec, or `__str__` when `__format__` was needed for `f"{x:>8}"`.
- Relying on `__del__` to release a resource.
- `__getitem__` that handles ints but not slices (or the reverse).
- `__hash__` on a mutable object.

## Key takeaways

- `__call__`, `__format__`, `__bool__`, `__index__`, `__int__`/`__float__` connect an object to calling, f-strings, truth and integer contexts.
- Binary operators try the forward method, then the reflected one; return `NotImplemented`, not an exception; `__iadd__` returns `self`.
- `__getitem__` receives ints, slices or tuples; `__missing__` customises dict misses; `__contains__` and `__reversed__` have iteration fallbacks.
- `__del__` is not a reliable destructor; use `with`, `close` or `weakref.finalize`.
- A complete value type is a dozen small methods; the checkpoint's `Vector` is the template.
