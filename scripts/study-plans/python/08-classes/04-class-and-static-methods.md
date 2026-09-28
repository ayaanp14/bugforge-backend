---
title: Class methods and static methods
minutes: 12
seo-title: Python classmethod vs staticmethod: When to Use Each
description: An instance method gets self, a class method gets cls and a static method gets neither. Alternative constructors, class-level counters and namespaced helpers.
question: What is the difference between classmethod and staticmethod in Python?
answer: A `@classmethod` receives the class as its first argument, `cls`, so it can build instances or change class-level state; a `@staticmethod` receives neither class nor instance and is a plain function living in the class namespace. Both can be called on the class or on an instance. An ordinary method, by contrast, receives the instance as `self`.
q: When should I use a classmethod in Python?
a: Use `@classmethod` for alternative constructors — `from_iso`, `from_dict`, `today` — that parse or compute their arguments and then return `cls(...)`, and for reading or changing state that belongs to the class, such as an instance counter or a shared setting.
q: Why should a classmethod call `cls()` instead of the class name?
a: `cls` is whichever class the method was called on, so a subclass that inherits `from_iso` gets an instance of itself back. A hard-coded `Date(...)` would return the base class even when called as `UTCDate.from_iso(...)`.
q: When should I use a staticmethod in Python?
a: Use `@staticmethod` for a helper that belongs with the class conceptually but needs neither the instance nor the class, such as a validation rule. A module-level function beside the class is often simpler; if the function needs `cls`, it should be a class method.
q: Why does `self.count += 1` not update a class counter?
a: It reads the class attribute, adds one and assigns the result as a new instance attribute on `self`, which shadows the class value and leaves it unchanged. Update it through the class instead: `type(self).count += 1`, or `cls.count += 1` inside a class method.
---
Not every function in a class body needs an instance. A method that builds an instance from some other form — a string, a dictionary, a file — has no `self` to work with yet; a helper that merely belongs with the class conceptually needs neither the instance nor the class. Python marks these with two decorators: `@classmethod` receives the class as its first argument, `@staticmethod` receives nothing. This lesson explains both, the alternative-constructor pattern that is `@classmethod`'s main job, why class methods respect subclassing where hard-coded class names do not, class-level counters and constants, and the case for a module-level function instead.

## Three kinds of method

```python
class Temperature:
    unit = "C"                                  # class attribute

    def __init__(self, degrees):
        self.degrees = degrees

    def describe(self):                         # instance method: needs the object
        return f"{self.degrees}°{self.unit}"

    @classmethod
    def from_fahrenheit(cls, f):                # class method: gets the class
        return cls((f - 32) * 5 / 9)

    @staticmethod
    def is_valid(degrees):                      # static method: gets nothing
        return degrees >= -273.15
```

```python
t = Temperature.from_fahrenheit(212)   # Temperature(100.0)
t.describe()                           # '100.0°C'
Temperature.is_valid(-300)             # False
t.is_valid(20)                         # True — callable through an instance too
```

The first parameter of a class method is the class itself, conventionally `cls`; the decorator arranges that whether the method is called on the class or on an instance. A static method is a plain function that happens to live in the class namespace — it could be a module-level function, and often should be.

## Alternative constructors

`__init__` takes one shape of arguments. When an object can be built from several, class methods named `from_…` are the idiom:

```python
class Date:
    def __init__(self, year, month, day):
        self.year, self.month, self.day = year, month, day

    @classmethod
    def from_iso(cls, text):                    # "2024-05-01"
        y, m, d = map(int, text.split("-"))
        return cls(y, m, d)

    @classmethod
    def from_ordinal(cls, n):
        ...
        return cls(y, m, d)

    @classmethod
    def today(cls):
        import datetime
        t = datetime.date.today()
        return cls(t.year, t.month, t.day)
```

Each parses or computes, then calls `cls(...)` — not `Date(...)`. The difference matters the moment someone subclasses: `class UTCDate(Date)` inherits `from_iso`, and `UTCDate.from_iso("2024-05-01")` returns a `UTCDate` because `cls` *is* `UTCDate`. A hard-coded `Date(...)` would return the base class from a subclass's constructor. The standard library does this everywhere: `dict.fromkeys`, `datetime.fromtimestamp`, `int.from_bytes`, `Path.home()`.

## Class-level state

A class method is also the natural way to read or change state that belongs to the class rather than to an instance:

```python
class Account:
    _count = 0
    _rate = 0.02

    def __init__(self, owner):
        self.owner = owner
        type(self)._count += 1            # or Account._count; cls in a classmethod

    @classmethod
    def count(cls):
        return cls._count

    @classmethod
    def set_rate(cls, rate):
        cls._rate = rate
```

`type(self)` inside an instance method is the object's actual class — the same idea as `cls`. Writing `self._count += 1` would be the class-attribute trap from lesson 1: it reads the class value and then creates an *instance* attribute, leaving the class counter untouched.

Class-level registries, caches and configuration follow the same pattern, and so does the singleton — one shared instance returned by a class method — which is usually better replaced by a module-level object (Module 12), since a module is already a singleton.

## Static methods: when, and when not

A static method is right when a function is *about* the class — a validation rule, a conversion helper, a factory of related values — and grouping it under the class name helps the reader find it, but it uses neither instance nor class state:

```python
class Matrix:
    @staticmethod
    def identity_rows(n):
        return [[int(i == j) for j in range(n)] for i in range(n)]
```

The alternative is a module-level function next to the class, which is what most Python code does: shorter to call, no decorator, trivially testable. Reach for `@staticmethod` when the function would otherwise be an orphan, when subclasses may want to override it, or when a name like `Matrix.identity_rows` documents the relationship. Never use it for something that actually needs `cls` — that is a class method.

## How the decorators work

`@classmethod` and `@staticmethod` wrap the function in a *descriptor* that changes what attribute lookup hands back: a bound method with `cls` filled in, or the bare function (Module 16). That is why they can be called on either the class or an instance, and why a plain function in the class body — no decorator — becomes an instance method expecting `self`. Calling `Temperature.describe()` without an instance is therefore the familiar `TypeError: missing 1 required positional argument: 'self'`.

## Pitfalls

- `return Date(...)` instead of `return cls(...)` in a class method — subclasses get the wrong type.
- `self._count += 1` for a class-level counter — it creates an instance attribute.
- `@staticmethod` on a function that uses `cls` or `self`.
- A `@classmethod` where an instance's data is needed.
- Calling an instance method on the class without an instance.
- A class used only as a namespace for static methods — that is a module.

## Key takeaways

- Instance methods get `self`, class methods get `cls` (via `@classmethod`), static methods get nothing (via `@staticmethod`).
- `from_…` class methods are alternative constructors; they call `cls(...)` so subclasses get instances of themselves.
- Class-level counters and settings are read and changed through `cls` or `type(self)`, never `self.x += …`.
- A static method is a namespaced helper; a module-level function is usually the simpler choice.
- The decorators are descriptors that decide what `obj.method` returns; an undecorated function is an instance method.
