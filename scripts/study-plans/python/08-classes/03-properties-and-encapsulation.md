---
title: Properties and encapsulation — the underscore, @property and __slots__
minutes: 13
seo-title: Python @property: Getters, Setters and Private Attributes
description: Python has no private keyword: one underscore marks internal state, two trigger name mangling. How @property validates and computes values, and what slots do.
question: What does @property do in Python?
answer: `@property` turns a method into an attribute read without parentheses, so a value can be computed, validated or made read-only while callers still write `c.radius`. A matching `@radius.setter` runs on assignment and `@radius.deleter` on `del`. Because a plain attribute can become a property later without changing any caller, Python code does not need Java-style getters and setters.
q: Does Python have private variables?
a: No. A single leading underscore, `_balance`, marks an attribute as internal by convention, and nothing stops a caller reading it. A double leading underscore, `__balance`, is name-mangled to `_ClassName__balance`, which avoids clashes with a subclass's attribute of the same name but is not privacy.
q: Should I write getters and setters in Python?
a: Not up front. Start with a public attribute; if you later need validation or a computed value, turn it into a `@property` and every caller's `obj.x` keeps working. Methods such as `get_x` and `set_x` add ceremony without adding control.
q: What is `__slots__` in Python?
a: `__slots__` declares an instance's attribute names up front, so they are stored in fixed slots instead of a per-instance `__dict__`. Instances use less memory — roughly half for small objects — and assigning a misspelt attribute raises `AttributeError`. Subclasses must declare their own `__slots__`, and `@dataclass(slots=True)` generates it for you.
q: What is cached_property in Python?
a: `functools.cached_property` computes a value on first access and stores it in the instance's dict, so later reads cost nothing. Use it for expensive values that never change after construction; if the underlying data can change, the cached value goes stale, and `del obj.attr` clears it.
q: How do I make a read-only attribute in Python?
a: Define a `@property` with no setter: reading works and assigning raises `AttributeError`. For a wholly immutable object, use a frozen dataclass or a `NamedTuple`, which suits classes that represent values such as a point or an amount of money.
---
Python has no `private` keyword and does not want one. Encapsulation is done by convention — a leading underscore means "not part of the interface" — and enforced socially rather than by the compiler, on the principle that consenting adults may reach inside an object if they accept the consequences. What Python does offer is `@property`, which lets an attribute *look* like plain data while being computed, validated or read-only, so that a class can start with public attributes and add control later without changing a single caller. This lesson covers the naming conventions and what name mangling actually does, `@property` with setters and deleters, computed and cached attributes, read-only attributes, and `__slots__`.

## The underscore conventions

| Name | Meaning |
| --- | --- |
| `balance` | public: part of the interface, safe to use |
| `_balance` | internal: use at your own risk; not imported by `from m import *` |
| `__balance` | name-mangled: stored as `_ClassName__balance` to avoid clashes in subclasses |
| `__init__` | a dunder: a protocol method Python calls; never invent your own |

`_name` is the working convention and the only one most code needs. `__name` (two leading, no trailing underscores) is rewritten by the compiler to `_ClassName__name`; it is not privacy — `obj._Account__balance` reads it — but a way to keep a subclass's attribute of the same name from colliding with the base class's. Reserve it for that case.

## Start with plain attributes

```python
class Circle:
    def __init__(self, radius):
        self.radius = radius
```

Java-style getters and setters (`get_radius`, `set_radius`) have no place in Python, because a public attribute can be turned into a property later with no change to callers. Write the plain attribute; add control when there is a reason.

## @property

```python
class Circle:
    def __init__(self, radius):
        self.radius = radius              # goes through the setter below

    @property
    def radius(self):
        return self._radius

    @radius.setter
    def radius(self, value):
        if value < 0:
            raise ValueError("radius must be non-negative")
        self._radius = value

    @property
    def area(self):                       # computed; read-only because there is no setter
        return 3.141592653589793 * self._radius ** 2

c = Circle(2)
c.radius = 3          # setter runs: validated
c.area                # 28.27… — an attribute in syntax, a method in fact
c.area = 1            # AttributeError: can't set attribute
```

`@property` turns a method into an attribute read; `@name.setter` adds the write; `@name.deleter` handles `del c.radius`. The stored value lives in `_radius`; the public name `radius` is the property. Note that `__init__` assigns through the property, so validation applies from the start. Three uses: **validation** (reject bad values), **computed attributes** (`area` from `radius`, kept consistent automatically), and **read-only** attributes (a property with no setter).

A property should be cheap and side-effect-free — a reader sees `c.area` and assumes a field read. Anything expensive or that changes state is a method (`c.compute_area()`), so the call is visible.

## Cached computed attributes

`functools.cached_property` computes once on first access and stores the result in the instance dict:

```python
from functools import cached_property

class Report:
    def __init__(self, rows):
        self.rows = rows

    @cached_property
    def total(self):
        return sum(r.amount for r in self.rows)
```

Right for values that are expensive and do not change after construction; wrong if `rows` can be mutated later, because the cached value would be stale. `del report.total` clears the cache.

## Read-only and immutable objects

A property without a setter gives one read-only attribute. For a wholly immutable object, the tools are a `frozen` dataclass (lesson 5), a `NamedTuple`, or a custom `__setattr__` that raises after `__init__` (Module 16). Immutable value objects are the easy ones to reason about, hash and share, and are what to reach for when a class represents a *value* (a point, a money amount, a date) rather than an *entity* with a life cycle (an account, a connection).

## __slots__

By default every instance carries a `__dict__`. `__slots__` declares the attribute names up front, and the instance stores them in fixed slots instead:

```python
class Point:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x, self.y = x, y

p = Point(1, 2)
p.z = 3               # AttributeError: 'Point' object has no attribute 'z'
```

Two effects: memory per instance drops (roughly by half for small objects, which matters for millions of points), and attribute typos become errors instead of silently creating new attributes. The cost: no dynamic attributes, and subclasses must declare their own `__slots__` or they get a `__dict__` back. Use it for small, numerous, fixed-shape objects; `@dataclass(slots=True)` writes it for you.

## What encapsulation is for

The point is not secrecy but *invariants*: a class promises that `radius` is never negative, that `balance` equals the sum of its transactions, that `_index` always matches `_items`. Every write path that could break the promise — the constructor, a setter, a method — is where the check goes, and readers of the class can then assume the invariant everywhere else. An attribute that can be set to anything by anyone has no invariant to assume. Underscores mark the state that only the class's own methods should touch; properties guard the state that callers may set.

## Pitfalls

- Java-style `get_x`/`set_x` methods.
- A property that does expensive work or has side effects.
- `__name` for privacy; it is for subclass collision avoidance.
- Assigning to `self.radius` in `__init__` *before* the property exists in a way that bypasses validation (it does go through the setter; but assigning to `self._radius` directly would not).
- `cached_property` on data that changes.
- A typo in an attribute name silently creating a new attribute — `__slots__` catches it.

## Key takeaways

- `_name` marks internal state; `__name` is compiler-mangled to `_Class__name` for subclass safety; nothing is truly private.
- Start with plain attributes; `@property` and `@x.setter` add validation, computation or read-only-ness later without changing callers.
- Properties are cheap and pure; expensive work is a method; `cached_property` for expensive, stable values.
- Value objects should be immutable: frozen dataclass or `NamedTuple`.
- `__slots__` fixes the attribute set, saves memory and catches typos.
