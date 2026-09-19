---
title: Dataclasses — classes that are mostly data
minutes: 14
---
Most classes are records: a few named fields, an `__init__` that stores them, a `__repr__` that shows them, an `__eq__` that compares them. Writing those by hand is twenty lines of boilerplate per class and a bug every time a field is added to one method and not the others. `@dataclass` (3.7) generates them from the field annotations, and its options add ordering, immutability, hashing, slots and keyword-only construction. This lesson covers the decorator, defaults and `field`, the generated methods, the options that matter, `__post_init__` for validation and derived fields, the helpers `asdict`/`astuple`/`replace`, and when a plain class is still the better tool.

## The basic form

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float = 0.0

p = Point(1.5)
p                  # Point(x=1.5, y=0.0)   — __repr__
p == Point(1.5, 0) # True                  — __eq__ compares fields as a tuple
p.x = 2            # mutable by default
```

Each annotated class attribute becomes a field, in declaration order; the annotations are the field types (not enforced, like all hints). The decorator writes `__init__(self, x, y=0.0)`, `__repr__` and `__eq__`. Fields with defaults must come after those without, as in any signature.

## Defaults and field()

```python
from dataclasses import dataclass, field

@dataclass
class Team:
    name: str
    members: list[str] = field(default_factory=list)    # a fresh list per instance
    size_limit: int = 10
    _id: int = field(default=0, repr=False, compare=False)
```

A mutable default (`members: list = []`) is refused with `ValueError: mutable default … use default_factory` — the dataclass machinery knows the trap from Module 4. `default_factory` takes a zero-argument callable, called per instance. `field()` also controls whether a field appears in `repr`, `eq`/ordering (`compare=False`), `__init__` (`init=False` for a field computed later), and carries `metadata`.

## Options

```python
@dataclass(order=True)          # __lt__, __le__, __gt__, __ge__ comparing fields in order
@dataclass(frozen=True)         # assignment after __init__ raises; instances are hashable
@dataclass(slots=True)          # __slots__ generated (3.10): smaller, no dynamic attributes
@dataclass(kw_only=True)        # every field keyword-only in __init__ (3.10)
@dataclass(eq=False)            # keep identity comparison and the default hash
```

`order=True` compares instances as tuples of their fields, which is right when the declaration order is the sort order (a `Version(major, minor)`); when it is not, define `__lt__` yourself or put a sort key first. `frozen=True` gives a value object: `p.x = 2` raises `FrozenInstanceError`, and because the fields cannot change, the decorator generates `__hash__` so instances work as dict keys and set members. `frozen=True, slots=True` together is the tightest value type Python offers without writing dunders. `kw_only=True` prevents positional-argument mix-ups in classes with many same-typed fields.

Hashing follows the rules of Module 7: an `eq=True` (the default), non-frozen dataclass is unhashable; `unsafe_hash=True` forces a hash on a mutable class, which is exactly as unsafe as it sounds.

## __post_init__

`__init__` is generated, so validation and derived fields go in `__post_init__`, which runs right after it:

```python
@dataclass
class Rect:
    width: float
    height: float
    area: float = field(init=False)

    def __post_init__(self):
        if self.width < 0 or self.height < 0:
            raise ValueError("negative dimension")
        self.area = self.width * self.height
```

In a frozen dataclass a derived field is set with `object.__setattr__(self, "area", …)` inside `__post_init__`, because normal assignment is blocked. `InitVar[T]` declares a pseudo-field that is passed to `__init__` and `__post_init__` but not stored.

## Helpers

```python
from dataclasses import asdict, astuple, replace, fields

asdict(p)                      # {'x': 1.5, 'y': 0.0} — recursive on nested dataclasses
astuple(p)                     # (1.5, 0.0)
replace(p, y=3)                # a new Point(x=1.5, y=3) — the frozen-friendly "modify"
[f.name for f in fields(Point)]   # ['x', 'y']
```

`asdict` is the bridge to JSON (`json.dumps(asdict(p))`); `replace` is how a frozen instance is "changed". Dataclasses are ordinary classes: methods, properties, class methods (`from_dict`) and inheritance all work, and a subclass's fields are appended after the base's.

## When not to use a dataclass

- The class has significant **behaviour and invariants** that `__init__` should enforce in a specific order — a hand-written `__init__` is clearer than `__post_init__` gymnastics.
- Equality should be **identity** (an account, a connection): use `eq=False` or a plain class.
- You need a **`NamedTuple`**: same field syntax, always immutable, unpackable, slightly lighter, but it *is* a tuple (`Point(1, 2) == (1, 2)` is `True`, which is rarely wanted).
- A plain **dict** is the right shape for loosely structured data that is never operated on.

The rule of thumb: a `@dataclass` for records with a fixed shape, `frozen=True` when they are values, a plain class when the constructor has logic, `NamedTuple` when tuple behaviour is wanted.

## Pitfalls

- A mutable default without `default_factory` (refused) — or a *shared object* passed as `default=` (accepted, and shared).
- `order=True` when the field order is not the sort order.
- Expecting type annotations to be checked.
- Forgetting that `asdict` copies deeply — large nested structures get duplicated.
- Assigning in `__post_init__` of a frozen class without `object.__setattr__`.
- A non-frozen dataclass used as a dict key (`TypeError`).

## Key takeaways

- `@dataclass` generates `__init__`, `__repr__` and `__eq__` from annotated fields; `field(default_factory=…)` for mutable defaults.
- `order=True` for tuple-style ordering, `frozen=True` for immutable, hashable value objects, `slots=True` for compact instances, `kw_only=True` for safe construction.
- `__post_init__` validates and derives; `InitVar` passes construction-only arguments.
- `asdict`, `astuple`, `replace`, `fields` are the helpers; `replace` is how frozen instances change.
- Use a plain class when the constructor has logic or equality is identity; `NamedTuple` when you want a tuple.
