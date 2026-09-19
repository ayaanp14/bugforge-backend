---
title: Type hints in depth — generics, unions, Callable, TypeVar and Protocol
minutes: 15
---
Module 4 introduced annotations as documentation that tools can check. This lesson is the vocabulary a real codebase uses: the built-in generics and what to hint on parameters versus returns, unions and `Optional`, `Callable` signatures, `TypeVar` for functions and classes that are generic over a type, `Generic` classes, `ClassVar` and `Final`, `TypedDict` for dict-shaped data, `Literal` for a fixed set of strings, and `Any` as the deliberate escape hatch. All of it runs on 3.11; the 3.12 `type` statement and `def f[T]` syntax are described at the end as reading only.

## The built-in generics

```python
def total(xs: list[int]) -> int: ...
def index(names: dict[str, int]) -> None: ...
def pair() -> tuple[int, str]: ...            # a 2-tuple with those types
def many() -> tuple[int, ...]: ...            # any length, all ints
def uniq(xs: set[str]) -> frozenset[str]: ...
```

Since 3.9 the built-in types take subscripts directly; `typing.List` and friends are the pre-3.9 spellings, still accepted, no longer needed. A subscript is a hint only — `list[int]` at run time is a `types.GenericAlias`, and `isinstance(x, list[int])` is a `TypeError`; `isinstance(x, list)` is the run-time check.

## Parameters wide, returns narrow

```python
from collections.abc import Iterable, Sequence, Mapping, Iterator, Callable

def mean(xs: Iterable[float]) -> float: ...          # accepts list, tuple, set, generator, range
def first(xs: Sequence[str]) -> str: ...             # needs indexing: list, tuple, str
def lookup(table: Mapping[str, int], k: str) -> int: ...
def evens(n: int) -> Iterator[int]: ...              # a generator function's return
def build() -> list[str]: ...                        # the concrete type you actually produce
```

A parameter hinted `list[int]` rejects a tuple; `Iterable[int]` accepts anything the function can loop over. Hint the *minimum* the function needs — `Iterable` if it only loops, `Sequence` if it indexes or slices, `Mapping` if it looks up, `MutableSequence`/`MutableMapping` if it modifies — and return the concrete type. The abstract names live in `collections.abc` (the `typing` aliases are deprecated).

## Unions and Optional

```python
def parse(text: str) -> int | None: ...                  # 3.10 syntax
def load(source: str | Path) -> bytes: ...
from typing import Optional, Union
def parse_old(text: str) -> Optional[int]: ...           # == int | None
def load_old(source: Union[str, Path]) -> bytes: ...
```

`X | None` is the honest type of anything that can be absent, and a checker then requires a `None` test before use. `Optional[X]` means exactly `X | None` — *not* "an optional parameter"; a parameter with a default is optional whatever its type.

## Callable

```python
from collections.abc import Callable

def apply(f: Callable[[int, str], bool], n: int, s: str) -> bool:
    return f(n, s)

Handler = Callable[[str], None]                # an alias
def on_event(handler: Handler) -> None: ...
def make_adder(k: int) -> Callable[[int], int]: ...
Callable[..., int]                             # any arguments, returns int
```

`Callable[[arg types], return type]` describes functions, lambdas, bound methods and callable objects alike. For keyword arguments or `*args` precision, `Protocol` with a `__call__` (Module 9) or `ParamSpec` (3.10, reading) are the tools.

## TypeVar and generic functions

```python
from typing import TypeVar
from collections.abc import Sequence

T = TypeVar("T")

def first(xs: Sequence[T]) -> T:               # whatever element type goes in comes out
    return xs[0]

def pairwise_max(a: T, b: T) -> T: ...

N = TypeVar("N", int, float)                   # constrained: only these
def double(x: N) -> N: ...

from typing import Hashable
H = TypeVar("H", bound=Hashable)               # bound: anything hashable
def dedupe(xs: Sequence[H]) -> list[H]: ...
```

A `TypeVar` links the types of parameters and return: `first(["a"])` is `str`, `first([1])` is `int`, and the checker knows. Constraints limit to a list of types; `bound=` limits to subtypes of one.

## Generic classes

```python
from typing import Generic, TypeVar

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

s: Stack[int] = Stack()
s.push(1)
s.push("x")            # checker: error
```

`Generic[T]` makes the class subscriptable; `Stack[int]` is a stack whose `push`/`pop` are checked for ints. The standard containers are generic in exactly this way.

## ClassVar, Final, Literal, TypedDict, NewType

```python
from typing import ClassVar, Final, Literal, TypedDict, NewType, Any

class Config:
    instances: ClassVar[int] = 0          # a class attribute, not a per-instance field (dataclasses honour this)
    name: str

MAX_RETRIES: Final = 3                    # the checker forbids reassignment

def open_mode(mode: Literal["r", "w", "a"]) -> None: ...   # only these strings

class Movie(TypedDict):                   # a dict with known string keys and value types
    title: str
    year: int

m: Movie = {"title": "Heat", "year": 1995}

UserId = NewType("UserId", int)           # a distinct type for the checker, an int at run time
def fetch(uid: UserId) -> None: ...
fetch(UserId(5)); fetch(5)                # the second is a checker error

def log(value: Any) -> None: ...          # Any: anything; disables checking for that value
```

`TypedDict` types JSON-shaped data without converting it to a class; `Literal` types the string flags every API has; `NewType` stops ids of different kinds being mixed; `Any` is the explicit opt-out, and `object` is the type meaning "anything, but you may do nothing with it until you narrow it".

## 3.12 and later, as reading

```python
type Pair = tuple[int, int]               # 3.12: a type alias statement
def first[T](xs: Sequence[T]) -> T: ...   # 3.12: PEP 695 — no TypeVar declaration
class Stack[T]: ...
```

On 3.11, aliases are ordinary assignments (`Pair = tuple[int, int]`, or `Pair: TypeAlias = …`) and generics use `TypeVar`. The meaning is identical; only the spelling changed.

## Pitfalls

- `isinstance(x, list[int])` — use `list`.
- `list[int]` on a parameter that only iterates.
- Confusing `Optional[X]` with "has a default".
- Forgetting that hints are not enforced — validate at boundaries (Module 10).
- A `TypeVar` used in only one place (it links nothing; use the plain type).
- `Any` spreading through a codebase until nothing is checked.

## Key takeaways

- `list[int]`, `dict[str, int]`, `tuple[int, ...]`, `X | None`, `Callable[[…], R]` are the everyday hints; abstract parameter types from `collections.abc`.
- Hint parameters as wide as the function allows and returns as narrow as it produces.
- `TypeVar` links parameter and return types; `Generic[T]` makes classes generic; constraints and bounds limit it.
- `ClassVar`, `Final`, `Literal`, `TypedDict`, `NewType` express intent the checker enforces; `Any` opts out.
- 3.12's `type` and `def f[T]` are spellings of the same ideas.
