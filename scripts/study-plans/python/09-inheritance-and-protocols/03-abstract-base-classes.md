---
title: Abstract base classes — abc and collections.abc
minutes: 14
---
Duck typing answers "can this object do X?" at the moment X is attempted. An abstract base class answers it earlier: a class that declares `@abstractmethod`s cannot be instantiated until a subclass fills them in, so a missing method fails at construction rather than deep inside a call. The standard library's `collections.abc` goes further — implement the two or three core methods of `Sequence` or `Mapping` and the ABC supplies the rest. This lesson covers `abc.ABC` and `@abstractmethod`, abstract properties and class methods, `collections.abc` with its mixin methods, `register` for virtual subclasses, and `isinstance` against an ABC as the type check that respects duck typing.

## Declaring an interface

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self) -> str:                      # concrete: uses the abstract ones
        return f"{type(self).__name__}: area {self.area():.2f}, perimeter {self.perimeter():.2f}"

class Rect(Shape):
    def __init__(self, w, h):
        self.w, self.h = w, h
    def area(self):
        return self.w * self.h
    def perimeter(self):
        return 2 * (self.w + self.h)

Shape()          # TypeError: Can't instantiate abstract class Shape with abstract methods area, perimeter
Rect(2, 3).describe()    # 'Rect: area 6.00, perimeter 10.00'
```

`ABC` is the base that switches the check on; `@abstractmethod` marks what subclasses must provide. A subclass that leaves one out is itself abstract and cannot be instantiated — the error names the missing methods, at the point of construction. Concrete methods on the ABC (`describe`) are the *template method* pattern: shared behaviour written once in terms of the abstract operations.

The `...` body is conventional for an abstract method; a docstring or `raise NotImplementedError` also works. An abstract method *may* have a body that subclasses call via `super()`.

## Abstract properties and class methods

```python
class Plugin(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @classmethod
    @abstractmethod
    def from_config(cls, cfg): ...
```

Stack `@abstractmethod` innermost. A subclass may satisfy an abstract property with a plain class attribute `name = "csv"` or a property — either makes the name resolvable, which is all the check requires.

## collections.abc

The ABCs in `collections.abc` describe the built-in protocols and, crucially, supply *mixin methods* derived from a few abstract ones:

| ABC | You implement | You get for free |
| --- | --- | --- |
| `Iterable` | `__iter__` | — |
| `Sized` | `__len__` | — |
| `Container` | `__contains__` | — |
| `Sequence` | `__getitem__`, `__len__` | `__contains__`, `__iter__`, `__reversed__`, `index`, `count` |
| `MutableSequence` | + `__setitem__`, `__delitem__`, `insert` | `append`, `extend`, `pop`, `remove`, `__iadd__`, … |
| `Mapping` | `__getitem__`, `__len__`, `__iter__` | `__contains__`, `keys`, `items`, `values`, `get`, `__eq__` |
| `MutableMapping` | + `__setitem__`, `__delitem__` | `pop`, `popitem`, `clear`, `update`, `setdefault` |
| `Set` | `__contains__`, `__iter__`, `__len__` | `__le__`, `__and__`, `__or__`, `isdisjoint`, … |

```python
from collections.abc import Sequence

class Countdown(Sequence):
    def __init__(self, n):
        self.n = n
    def __len__(self):
        return self.n
    def __getitem__(self, i):
        if isinstance(i, slice):
            return [self[j] for j in range(*i.indices(self.n))]
        if i < 0:
            i += self.n
        if not 0 <= i < self.n:
            raise IndexError(i)
        return self.n - i

c = Countdown(3)
list(c), 2 in c, c.index(1), c.count(3), list(reversed(c))   # [3, 2, 1] True 2 1 [1, 2, 3]
```

Two methods, and the class is a full read-only sequence — with `index` and `count` you did not write, and `isinstance(c, Sequence)` true. `MutableMapping` is the way to build a dict-like class with custom storage: implement five methods and `update`, `setdefault`, `pop` arrive.

## isinstance against an ABC

The `collections.abc` classes recognise duck-typed objects through `__subclasshook__`: `isinstance(x, Iterable)` is true for anything with `__iter__`, whether or not it inherits from `Iterable`. That makes ABCs the right target for the boundary checks of the previous lesson:

```python
from collections.abc import Iterable, Mapping

def flatten(items):
    for x in items:
        if isinstance(x, Iterable) and not isinstance(x, (str, bytes)):
            yield from flatten(x)
        else:
            yield x

def merge(a: Mapping, b: Mapping) -> dict: ...
```

`Iterable` rather than `list` accepts tuples, sets, generators and custom classes; the `str` exclusion is the string-versus-sequence rule again. `Hashable`, `Callable`, `Sized` work the same way. For your own ABCs the hook is not automatic — a class must inherit, or be registered.

## register: virtual subclasses

```python
class Drawable(ABC):
    @abstractmethod
    def draw(self): ...

Drawable.register(SomeThirdPartyClass)      # promises it has draw(); nothing is checked
isinstance(SomeThirdPartyClass(), Drawable) # True
```

Registration makes `isinstance` say yes for a class you cannot edit, without inheritance and without verification. It is rare, and the `Protocol` of lesson 5 is the modern answer to the same need.

## ABC versus duck typing versus Protocol

An ABC is right when there is **shared implementation** to inherit (template methods, mixins from `collections.abc`) or when a **construction-time guarantee** matters (a plugin system that must fail fast on an incomplete plugin). Duck typing is right when the code simply calls methods and any provider will do. A `Protocol` (lesson 5) is right when you want the static checker to verify the duck typing without requiring inheritance. All three coexist: your `Shape` ABC's subclasses are also ducks to any code that calls `.area()`.

## Pitfalls

- Forgetting `ABC` as a base (or `metaclass=ABCMeta`), so `@abstractmethod` is not enforced.
- Stacking `@abstractmethod` outermost over `@property` — it must be innermost.
- Subclassing `Sequence` but not handling `slice` in `__getitem__`.
- `isinstance(x, list)` at a boundary where `Sequence` or `Iterable` was meant.
- `isinstance(s, Iterable)` letting a string through as a sequence of characters.
- Expecting `register` to check anything.

## Key takeaways

- `class X(ABC)` with `@abstractmethod`s cannot be instantiated until every abstract method is defined; the error names them at construction.
- Concrete methods on an ABC are template methods written against the abstract ones.
- `collections.abc.Sequence`/`Mapping`/`Set` supply the full protocol from two or three core methods.
- `isinstance(x, Iterable)` (and friends) recognise duck-typed objects; check against ABCs, not concrete types, and exclude `str` from sequence checks.
- Use an ABC for shared implementation or fail-fast guarantees; duck typing or a `Protocol` otherwise.
