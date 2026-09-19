---
title: Multiple inheritance and the MRO — mixins and cooperative super()
minutes: 14
---
A class may list several bases: `class Report(JsonMixin, CsvMixin, Base)`. Python resolves which method wins with the C3 *method resolution order*, a single linear order over all the bases that respects each class's own base order and puts subclasses before their parents. `super()` follows that order rather than "the parent", which is what makes cooperative initialisation across several bases possible — and what makes `super().__init__(**kwargs)` the correct spelling in a mixin. This lesson shows the MRO, the diamond, cooperative `super()`, the mixin pattern that is the one everyday use of multiple inheritance, and the cases to avoid.

## The MRO

```python
class A:
    def who(self):
        return "A"

class B(A):
    def who(self):
        return "B>" + super().who()

class C(A):
    def who(self):
        return "C>" + super().who()

class D(B, C):
    def who(self):
        return "D>" + super().who()

D.__mro__          # (D, B, C, A, object)
D().who()          # 'D>B>C>A'
```

`D(B, C)` inherits from both, and both inherit from `A` — the diamond. C3 linearisation gives `D, B, C, A, object`: `D` first, then its bases left to right, with `A` placed *after every class that inherits from it*, and `object` last. Every class appears once. `super()` in `B` therefore calls `C.who`, not `A.who`, because `C` is next in *D's* MRO. `super()` means "the next class in the MRO of the instance's type", and that is the whole story.

An inconsistent order — `class X(A, B)` where `B` is a subclass of `A` — raises `TypeError: Cannot create a consistent method resolution order`, because `A` cannot both precede and follow `B`.

## Cooperative __init__

With several bases each needing initialisation, every class must call `super().__init__()` and forward what it does not consume:

```python
class Base:
    def __init__(self, **kwargs):
        super().__init__(**kwargs)          # ends at object.__init__(), which takes nothing

class Timestamped(Base):
    def __init__(self, *, created, **kwargs):
        super().__init__(**kwargs)
        self.created = created

class Named(Base):
    def __init__(self, *, name, **kwargs):
        super().__init__(**kwargs)
        self.name = name

class Event(Timestamped, Named):
    pass

e = Event(created="2024-05-01", name="deploy")
Event.__mro__       # (Event, Timestamped, Named, Base, object)
```

Each `__init__` takes its own arguments by keyword, passes the rest up, and sets its own attribute. The chain `Event → Timestamped → Named → Base → object` runs once through every class. Keyword-only parameters with `**kwargs` are what make this work regardless of the order the bases are combined in; positional arguments would have to agree on a position across unrelated classes.

## Mixins

A mixin is a class that provides one capability, holds no state of its own (or very little), and is meant to be combined with a real base:

```python
import json

class JsonMixin:
    def to_json(self):
        return json.dumps(self.__dict__, sort_keys=True)

class ReprMixin:
    def __repr__(self):
        fields = ", ".join(f"{k}={v!r}" for k, v in sorted(self.__dict__.items()))
        return f"{type(self).__name__}({fields})"

class Point(ReprMixin, JsonMixin):
    def __init__(self, x, y):
        self.x, self.y = x, y

Point(1, 2)              # Point(x=1, y=2)
Point(1, 2).to_json()    # '{"x": 1, "y": 2}'
```

Mixins go *before* the concrete base in the bases list so that their methods take precedence, are named `…Mixin` by convention, and depend on the host class only through a documented attribute or method (`self.__dict__` here). This is the everyday use of multiple inheritance in Python: `socketserver.ThreadingMixIn`, Django's view mixins, `unittest` test mixins — small, orthogonal, composable.

## Reading an unfamiliar hierarchy

When a method behaves unexpectedly in a class with several bases, three lines settle it: `print(Cls.__mro__)` for the order, `Cls.method` (without calling) to see which class the attribute resolves to — its `__qualname__` names the defining class — and `inspect.getsource` when the body matters. Most surprises are a mixin listed after the base it was meant to override, or an `__init__` in the chain that does not call `super()` and so silently ends the cooperative sequence for every class after it.

## Interfaces through ABCs

Combining several ABCs is multiple inheritance too: `class Deck(Sequence, Hashable)` promises both protocols. Since ABCs carry little or no state and their abstract methods are disjoint, they combine without cooperative-`__init__` concerns.

## When to avoid it

- **Two concrete classes with real state and their own `__init__` signatures.** Their initialisers will not compose without the `**kwargs` discipline, and their attributes may collide. Compose instead: hold one as an attribute of the other.
- **Inheriting for code reuse when there is no is-a relationship.** A `Stack(list)` is not a list; a `Logger(Thread)` is not a thread. Composition again.
- **Deep or wide hierarchies** that make `__mro__` a research task. If a reader must print the MRO to predict which method runs, the design has failed.

`ClassName.__mro__` and `ClassName.mro()` show the order; `inspect.getmro` too. Print it when in doubt — but design so that nobody has to.

## Pitfalls

- `Base.__init__(self)` by name in a mixin, breaking the chain for other bases.
- Positional arguments in cooperative `__init__`s.
- A mixin placed *after* the base, so the base's method wins.
- Expecting `super()` to mean "my parent" in a diamond.
- Two bases defining the same attribute name for different purposes.
- Multiple inheritance where an attribute holding the other object would be clearer.

## Key takeaways

- The MRO is a C3 linearisation: subclass first, bases left to right, a shared base after all its subclasses; `Class.__mro__` shows it.
- `super()` calls the next class in the *instance's* MRO, which in a diamond is a sibling, not the parent.
- Cooperative `__init__`: every class calls `super().__init__(**kwargs)` and takes its own arguments by keyword.
- Mixins add one capability, hold no state, go first in the bases list, and are the everyday use of multiple inheritance.
- Combine ABCs freely; avoid combining stateful concrete classes — compose them instead.
