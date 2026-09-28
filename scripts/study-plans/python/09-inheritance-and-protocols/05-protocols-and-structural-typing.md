---
title: Protocols and structural typing — typing.Protocol
minutes: 13
seo-title: Python typing.Protocol: Structural Typing vs ABCs
description: A Python Protocol lists methods, and any object that has them conforms with no inheritance. Type-checked duck typing, runtime checks, and Protocol vs ABC.
question: What is a Protocol in Python?
answer: A `Protocol`, from the `typing` module (Python 3.8+), is a class that lists methods and attributes; any object that has them satisfies it, with no inheritance or registration. That is structural typing: a type checker such as mypy verifies every call site, while nothing changes at run time. It lets type hints describe duck-typed code, such as a parameter accepting anything with a `speak()` method.
q: What is the difference between Protocol and ABC in Python?
a: A `Protocol` is structural: any class with the right members conforms, the type checker verifies it, and it should hold no implementation. An ABC is nominal: classes must inherit from it or be registered, it can share concrete methods, and it refuses to instantiate an incomplete subclass.
q: What does `@runtime_checkable` do?
a: It lets a `Protocol` be used with `isinstance`, which otherwise raises `TypeError`. The check only looks for the member names, not their signatures, so an object with a non-callable attribute of the right name still passes.
q: What is structural typing in Python?
a: Structural typing decides compatibility by an object's shape — the methods and attributes it has — rather than by the classes it inherits from, which is nominal typing. `typing.Protocol` brings structural typing to Python's type hints, matching how duck-typed code already behaves.
q: Can a Python Protocol declare attributes?
a: Yes. `name: str` in a protocol matches any object with a `name` of a compatible type, whether an instance attribute, a class attribute or a property. A read-only `@property` in a protocol is satisfied by a plain attribute too.
q: Should I write my own Protocol or use a standard one?
a: Use the standard ones first: `Iterable`, `Sequence`, `Mapping`, `Callable`, `Hashable` and the `Supports…` protocols such as `SupportsInt` already describe the common shapes. Write your own only for operations of your own, like a `Speaker` with `speak()`.
---
Duck typing has always been how Python code works; `typing.Protocol` (3.8) is how a type checker can *verify* it. A protocol is a class that lists methods and attributes; any object that has them satisfies the protocol — no inheritance, no registration — and `mypy` will report a caller that passes something that does not. That is *structural* typing (shape decides) as opposed to *nominal* typing (declared lineage decides), and it is what type hints for duck-typed code should say. This lesson covers declaring a protocol, using it as a hint, `@runtime_checkable` for `isinstance`, protocols with attributes and generic protocols, the `Supports…` protocols in the standard library, and when to choose a protocol over an ABC.

## Declaring and using a protocol

```python
from typing import Protocol

class Speaker(Protocol):
    def speak(self) -> str: ...

class Dog:                          # no inheritance from Speaker
    def speak(self) -> str:
        return "woof"

class Robot:
    def speak(self) -> str:
        return "beep"

def chorus(things: list[Speaker]) -> str:
    return " ".join(t.speak() for t in things)

chorus([Dog(), Robot()])            # checker: fine — both have speak() -> str
chorus([Dog(), 42])                 # checker: error — int has no speak
```

The protocol body lists the members with `...` bodies. Nothing changes at run time: `Dog` and `Robot` are ordinary classes, `chorus` calls `speak()` as before. The hint `list[Speaker]` tells the checker the shape, and the checker verifies every call site. Method signatures matter — a `speak(self, loud: bool)` would not match — and return types must be compatible.

## runtime_checkable

By default `isinstance(x, Speaker)` raises `TypeError`, because a protocol is a static notion. `@runtime_checkable` allows it, checking that the *method names* exist (not their signatures):

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Closable(Protocol):
    def close(self) -> None: ...

if isinstance(resource, Closable):
    resource.close()
```

This is `hasattr` with a name and a hint, and it is the correct run-time counterpart of the static check. It only inspects presence: an object with a `close` *attribute* that is not callable would pass.

## Attributes and properties in a protocol

```python
class Named(Protocol):
    name: str                       # a data attribute

class HasArea(Protocol):
    @property
    def area(self) -> float: ...    # a read-only property (a plain attribute satisfies it too)
```

An attribute in a protocol matches an instance attribute, a class attribute or a property of the same name and compatible type. This is how a hint says "anything with a `.name`" — the shape of a dataclass, a named tuple and a hand-written class all match.

## The standard protocols

`typing` and `collections.abc` already define the ones most code needs, so write your own only for your own operations:

| Protocol | Requires |
| --- | --- |
| `Iterable[T]`, `Iterator[T]` | `__iter__` / `__next__` |
| `Sized`, `Container[T]`, `Collection[T]` | `__len__`, `__contains__`, both plus `__iter__` |
| `Sequence[T]`, `Mapping[K, V]` | the sequence / mapping methods |
| `Callable[[A, B], R]` | `__call__` with that signature |
| `Hashable` | `__hash__` |
| `SupportsInt`, `SupportsFloat`, `SupportsIndex`, `SupportsAbs` | `__int__`, `__float__`, `__index__`, `__abs__` |
| `ContextManager[T]` | `__enter__` / `__exit__` |

The `collections.abc` names are both ABCs (for inheritance and `isinstance`) and, to the checker, structural: a parameter hinted `Iterable[int]` accepts any class with `__iter__`, whether or not it inherits.

## Generic protocols

```python
from typing import Protocol, TypeVar

T = TypeVar("T")

class Comparable(Protocol):
    def __lt__(self, other: "Comparable") -> bool: ...

class Stack(Protocol[T]):
    def push(self, item: T) -> None: ...
    def pop(self) -> T: ...

def smallest(xs: list[Comparable]) -> Comparable:
    return min(xs)
```

A protocol may take type parameters like any generic (Module 15 covers `TypeVar` in full). `Comparable` is the classic one — "anything with `__lt__`" — and is what `sorted`'s elements must be. (3.12's `class Stack[T](Protocol)` syntax is reading only on this track's runtime.)

## Protocol versus ABC

| | Protocol | ABC |
| --- | --- | --- |
| Conformance | structural: having the members | nominal: inheriting (or `register`) |
| Enforced | by the type checker; `runtime_checkable` for `isinstance` | at instantiation (`TypeError` for missing methods) |
| Shared implementation | none — a protocol should be pure interface | yes: concrete and mixin methods |
| Third-party classes | conform automatically | must inherit or be registered |
| Use for | hints on parameters that accept "anything with these methods" | base classes you control that share code or must fail fast |

A common combination: an ABC for your own hierarchy's shared behaviour, and a `Protocol` in the signature of the function that only needs one method — so the function also accepts objects from outside the hierarchy.

## Pitfalls

- `isinstance(x, SomeProtocol)` without `@runtime_checkable` — `TypeError`.
- Expecting a runtime check to verify signatures; it checks names only.
- Putting implementation in a protocol; keep it an interface.
- Hinting a parameter with a concrete class when a protocol or ABC would accept more.
- Mismatched method signatures silently failing the structural match in the checker.
- Writing a protocol for something `collections.abc` already names.

## Key takeaways

- A `Protocol` lists members; any object with them conforms — structural typing, verified by the type checker.
- `@runtime_checkable` allows `isinstance`, checking member names only.
- Protocols may declare attributes and properties, and may be generic.
- Prefer the standard `Iterable`, `Sequence`, `Callable`, `Supports…` protocols to writing your own.
- Protocol for hints and third-party conformance; ABC for shared implementation and construction-time enforcement.
