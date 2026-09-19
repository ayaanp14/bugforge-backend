---
title: Enums — Enum, IntEnum, StrEnum, Flag and auto
minutes: 13
---
A status that is one of `pending`, `active`, `closed`; a colour; a permission set; a day of the week. Written as strings or small integers, such values can be misspelled, compared with the wrong constant, or given a value that means nothing — and nothing catches it. An `Enum` is a class whose instances are a fixed set of named constants: they are singletons, they compare by identity, they iterate in definition order, they look themselves up by name or value, and they print as `Status.ACTIVE`. This lesson covers `Enum`, `auto`, lookup and iteration, `IntEnum` and `StrEnum` for values that must also be ints or strings, `Flag` for combinable bits, `unique`, methods on enums, and enums in `match`.

## Enum

```python
from enum import Enum, auto

class Status(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    CLOSED = "closed"

s = Status.ACTIVE
s.name, s.value              # 'ACTIVE', 'active'
Status("active")             # Status.ACTIVE — lookup by value; ValueError if absent
Status["ACTIVE"]             # by name; KeyError if absent
s is Status.ACTIVE           # True — members are singletons
s == "active"                # False — an Enum is not its value
list(Status)                 # [Status.PENDING, Status.ACTIVE, Status.CLOSED] — definition order
len(Status), Status.ACTIVE in Status
str(s), repr(s)              # 'Status.ACTIVE', '<Status.ACTIVE: 'active'>'
```

Members are created from the class body's assignments; the value can be any object, but strings and ints are the norm. Two names with the same value are *aliases* for one member (`Status.OPEN = "active"` would be another name for `ACTIVE`); `@enum.unique` makes that a `ValueError`. `auto()` assigns values automatically (1, 2, 3 … for `Enum`; the lower-cased name for `StrEnum`):

```python
class Direction(Enum):
    NORTH = auto()
    EAST = auto()
    SOUTH = auto()
    WEST = auto()
```

## Why an enum

- **A closed set.** `Status("archived")` is an immediate `ValueError` — a typo cannot survive.
- **Identity.** `if status is Status.ACTIVE` cannot be confused with a similar string.
- **A type.** Hints say `def close(s: Status)`; a checker rejects a string.
- **Iteration and reflection.** A dropdown is `[m.value for m in Status]`; a parser is `Status(text)`.
- **A namespace for behaviour.** Methods on the enum put the logic next to the values.

## Methods and properties

```python
class Planet(Enum):
    EARTH = (5.97e24, 6.371e6)
    MARS = (6.42e23, 3.390e6)

    def __init__(self, mass, radius):        # unpacks the tuple value
        self.mass, self.radius = mass, radius

    @property
    def gravity(self):
        return 6.674e-11 * self.mass / self.radius ** 2

    @classmethod
    def heaviest(cls):
        return max(cls, key=lambda p: p.mass)

Planet.MARS.gravity, Planet.heaviest()
```

An enum is a class: it can have methods, properties, class methods and a custom `__str__`. The `__init__` receives the value (unpacked if a tuple), which is how a member carries several attributes.

## IntEnum and StrEnum

```python
from enum import IntEnum, StrEnum

class Priority(IntEnum):
    LOW = 1
    HIGH = 3

Priority.HIGH > Priority.LOW        # True — ordered like ints
Priority.HIGH + 1, Priority(3)      # 4, Priority.HIGH
sorted([Priority.HIGH, Priority.LOW])

class Colour(StrEnum):               # 3.11
    RED = auto()                     # value 'red'
    BLUE = "blue"

Colour.RED == "red"                 # True — it IS a str
f"{Colour.RED}"                     # 'red'
json.dumps({"c": Colour.RED})       # '{"c": "red"}'
```

A plain `Enum` member is *not* comparable to its value, and that strictness is usually what you want. `IntEnum` and `StrEnum` are subclasses of `int` and `str` too, so they compare, sort, serialise and substitute where the raw value is expected — the right choice for values that cross a boundary (a database column, a JSON field, an HTTP status) or must be ordered. The cost is that `Priority.LOW == 1` is also true for a `1` that came from anywhere.

## Flag

```python
from enum import Flag, auto

class Perm(Flag):
    READ = auto()        # 1
    WRITE = auto()       # 2
    EXEC = auto()        # 4

p = Perm.READ | Perm.EXEC
Perm.WRITE in p          # False
p & Perm.READ            # <Perm.READ: 1> — truthy
p | Perm.WRITE           # <Perm.READ|WRITE|EXEC: 7>
Perm(0), Perm(5)         # <Perm: 0>, <Perm.READ|EXEC: 5>
list(p)                  # [Perm.READ, Perm.EXEC] (3.11)
```

`Flag` members combine with `|`, `&`, `^` and `~`, test membership with `in`, and are the typed version of the bit masks of Module 2. `IntFlag` also behaves as an int.

## Enums in match and as keys

```python
match status:
    case Status.ACTIVE:              # a dotted name — a value pattern
        ...
    case Status.PENDING | Status.CLOSED:
        ...

counts = {s: 0 for s in Status}      # hashable, so dict keys and set members
```

The `match` rule of Module 3 applies: dotted names compare, bare names capture — `case ACTIVE:` would be a capture and a bug.

## Pitfalls

- Comparing a plain `Enum` member with its value (`Status.ACTIVE == "active"` is `False`).
- Two members with the same value silently becoming aliases — use `@unique`.
- `case ACTIVE:` without the class prefix.
- Using an `Enum` where JSON or a database needs the raw value — `.value`, or `StrEnum`/`IntEnum`.
- Mutating enum members or adding members at run time (they are constants).
- Choosing `IntEnum` for identity-only values, losing the strictness.

## Key takeaways

- An `Enum` is a closed set of named singleton constants with `.name`, `.value`, lookup by `Cls(value)` and `Cls[name]`, and iteration in definition order.
- `auto()` numbers members; `@unique` forbids aliases; methods, properties and tuple-valued `__init__` put behaviour on members.
- `IntEnum`/`StrEnum` are also ints/strings for ordering and serialisation; a plain `Enum` is strict.
- `Flag` members combine with bitwise operators and test with `in`.
- In `match`, use the dotted name; enums are hashable keys.
