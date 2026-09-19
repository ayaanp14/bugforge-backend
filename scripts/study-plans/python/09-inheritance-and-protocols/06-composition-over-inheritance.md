---
title: Composition over inheritance — Liskov, delegation and wrapping built-ins
minutes: 14
---
Inheritance says *is-a*; composition says *has-a*. A `Car` has an `Engine`; it is not one. Most of the trouble people have with class hierarchies comes from using inheritance for *has-a* relationships because it is the quickest way to reuse methods — and the cost arrives later, when the subclass cannot honour the base class's contract. This lesson states the Liskov substitution principle with the standard broken example, shows delegation as the composition mechanism (explicit forwarding and `__getattr__`), explains why subclassing `dict` and `list` misbehaves and what `UserDict`/`UserList` fix, and closes with the strategy pattern as composition of behaviour.

## Liskov: a subclass must be usable wherever its base is

```python
class Rectangle:
    def __init__(self, w, h):
        self.w, self.h = w, h
    def set_width(self, w):
        self.w = w
    def area(self):
        return self.w * self.h

class Square(Rectangle):              # a square is-a rectangle, mathematically…
    def __init__(self, side):
        super().__init__(side, side)
    def set_width(self, w):           # …but must keep its sides equal
        self.w = self.h = w

def stretch(r: Rectangle):
    r.set_width(10)
    return r.area()                   # a caller of Rectangle expects w * h with h unchanged

stretch(Rectangle(2, 3))              # 30
stretch(Square(3))                    # 100 — the Square broke the caller's expectation
```

`Square` inherits `set_width` and must override it to preserve its own invariant, and in doing so violates the *behavioural* contract of `Rectangle`: setting the width no longer leaves the height alone. Code written against `Rectangle` is wrong for `Square`. That is the Liskov substitution principle failing: a subclass must not strengthen preconditions, weaken postconditions, or break invariants the base promised. The mathematical is-a is not a software is-a when the base is *mutable*. The fixes: make both immutable value types (then `Square` really can be a `Rectangle`), or make them siblings under a `Shape` interface with no shared mutation.

The test to apply before subclassing: *could every function that takes the base be handed the subclass without noticing?* If not, compose.

## Delegation

Composition holds the other object and forwards the operations it chooses to expose:

```python
class Stack:
    def __init__(self):
        self._items = []                  # has-a list

    def push(self, x):
        self._items.append(x)

    def pop(self):
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def __len__(self):
        return len(self._items)
```

The `Stack` exposes three operations; `insert(0, x)`, slicing and `sort` — which would break a stack — do not exist on it. Compare `class Stack(list)`: one line shorter, forty methods leakier. Composition's interface is exactly what you wrote.

When many methods must be forwarded unchanged, `__getattr__` delegates the rest (Module 16 covers the mechanism):

```python
class LoggedList:
    def __init__(self, items):
        self._items = list(items)
        self.log = []

    def append(self, x):                  # the one method that differs
        self.log.append(f"append {x!r}")
        self._items.append(x)

    def __getattr__(self, name):          # everything else: forward to the list
        return getattr(self._items, name)
```

`__getattr__` is called only for attributes not found normally, so `append` is handled here and `sort`, `index`, `count` and the rest reach the list. One limit: dunders are *not* forwarded by `__getattr__`, because the interpreter looks them up on the type, so `len(logged)` still needs an explicit `__len__`. Forward the dunders you need by hand.

## Why subclassing dict and list misbehaves

```python
class UpperDict(dict):
    def __setitem__(self, key, value):
        super().__setitem__(key.upper(), value)

d = UpperDict()
d["a"] = 1              # {'A': 1}     — goes through __setitem__
d.update(b=2)           # {'A': 1, 'b': 2}  — update() is C code that bypasses it
UpperDict(c=3)          # {'c': 3}     — so does the constructor
```

The built-in containers are implemented in C, and their methods call each other's C implementations, not your Python overrides. `dict.update`, `dict.__init__`, `setdefault`, `list.extend`, `list.__init__` all skip the overridden method. The standard library's answer is `collections.UserDict`, `UserList` and `UserString`: Python classes that hold a real container in `.data` and route *every* operation through the basic methods, so an override of `__setitem__` is honoured everywhere:

```python
from collections import UserDict

class UpperDict(UserDict):
    def __setitem__(self, key, value):
        super().__setitem__(key.upper(), value)

d = UpperDict(c=3)
d.update(b=2)
d                       # {'C': 3, 'B': 2}
```

For a mapping with custom storage, `collections.abc.MutableMapping` (lesson 3) is the other correct base. Subclass `dict` itself only to add methods that do not change how existing ones behave.

## Strategy: composing behaviour

Inheritance fixes behaviour at class-definition time; composition can choose it at run time by holding a callable or an object:

```python
class Sorter:
    def __init__(self, key=None, reverse=False):
        self.key, self.reverse = key, reverse         # the strategy, as data

    def sort(self, xs):
        return sorted(xs, key=self.key, reverse=self.reverse)

class Pricer:
    def __init__(self, discount_rule):
        self.discount_rule = discount_rule            # a function or an object with .apply()

    def price(self, item):
        return self.discount_rule(item.base_price)
```

Where a subclass-per-variant design would produce `ByNameSorter`, `ByAgeSorter`, `ReverseByAgeSorter`, one class with a strategy field covers every combination, and the strategy is a plain function in most cases. Callbacks, key functions, comparators and handlers are all this pattern.

## The decision, in one paragraph

Inherit when the subclass *is* a base in every context the base is used, shares a real implementation with it, and you control both. Compose when you want to reuse behaviour, when the relationship is has-a or uses-a, when the wrapped object's full interface should not leak, or when the behaviour should vary at run time. Default to composition; promote to inheritance when the Liskov test passes and the shared code is substantial.

## Pitfalls

- Subclassing to reuse methods when the subclass cannot honour the base's contract.
- `class X(dict)` or `(list)` with overridden item methods — use `UserDict`/`UserList` or `MutableMapping`.
- Forgetting that `__getattr__` does not forward dunders.
- A hierarchy of subclasses that differ by one setting — make it a field.
- Exposing the composed object (`stack.items`) and losing the invariant.
- Deep hierarchies with `super()` chains nobody can predict.

## Key takeaways

- Liskov: a subclass must be usable wherever the base is; a mutable `Square(Rectangle)` fails the test.
- Composition holds the other object and forwards only the operations it means to expose; `__getattr__` forwards the rest, but not dunders.
- Built-in containers' C methods bypass Python overrides; subclass `UserDict`/`UserList` or `MutableMapping` to change behaviour.
- Behaviour that varies is a strategy field — usually a function — not a subclass per variant.
- Default to composition; inherit for genuine is-a with substantial shared implementation.
