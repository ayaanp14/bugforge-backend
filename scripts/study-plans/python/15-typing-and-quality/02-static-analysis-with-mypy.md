---
title: Static analysis with mypy — narrowing, strictness and the run-time view of hints
minutes: 13
seo-title: What Is mypy? Static Type Checking and Narrowing in Python
description: mypy checks Python type hints without running the code. How narrowing makes an optional value usable, what cast does, and running mypy in strict mode.
question: What is mypy?
answer: mypy is the reference static type checker for Python. It reads a program without running it, infers the type of every expression from literals, annotations and library stubs, and reports mismatches, such as a `str` passed where a `float` is expected or an `int | None` used as an `int`. It checks shape, not state, and barely checks functions that have no annotations.
q: What is type narrowing in Python?
a: Narrowing is a type checker refining a union after a test: after `if x is None: return`, a value hinted `int | None` is treated as `int`. `is None`, `isinstance`, `callable`, truthiness, `assert`, early returns and `match` class patterns all narrow; a custom test function narrows only when declared `-> TypeGuard[T]`.
q: What does typing.cast do?
a: `cast(int, value)` tells the type checker to treat `value` as an `int` and does nothing at run time: no conversion and no check. It is a promise, and if it is wrong the error appears somewhere else later, so use it sparingly and never to silence an error that is real.
q: What is `TYPE_CHECKING` used for in Python?
a: `typing.TYPE_CHECKING` is `False` at run time and treated as `True` by type checkers, so imports under `if TYPE_CHECKING:` are seen only by the checker. It breaks import cycles and avoids heavy imports needed only for hints; combine it with `from __future__ import annotations` so those names are never evaluated at run time.
q: Are Python type hints enforced at run time?
a: No. The interpreter stores annotations in `__annotations__` and otherwise ignores them, so a wrong type passes silently until something breaks. Tools read them instead: mypy and pyright check them statically, and libraries such as `dataclasses`, `functools.singledispatch` and `pydantic` read them at run time.
q: What does mypy --strict do?
a: `mypy --strict` turns on the checks a mature codebase needs, including requiring every function to be annotated and flagging calls into unannotated code and functions that return `Any`. New projects should start strict; existing ones tighten one flag at a time, with the settings in a `[tool.mypy]` table in `pyproject.toml`.
---
A type checker reads a program without running it and reports every place where a value could have a type the code does not handle: an `int | None` used as an `int`, a function called with the wrong argument, a method that does not exist on the declared type. `mypy` is the reference checker (`pyright` is the other widely used one, built into VS Code's Pylance). This lesson covers what a checker does and does not catch, *narrowing* — the way `isinstance` and `is None` tests make a union usable — `cast`, `reveal_type`, `TYPE_CHECKING`, `# type: ignore`, the strictness levels, and the run-time side: `__annotations__`, `get_type_hints` and the string annotations of `from __future__ import annotations`.

## What a checker does

```text
$ pip install mypy
$ mypy app.py
app.py:12: error: Argument 1 to "area" has incompatible type "str"; expected "float"  [arg-type]
app.py:20: error: Item "None" of "int | None" has no attribute "bit_length"  [union-attr]
Found 2 errors in 1 file (checked 1 source file)
```

It infers the type of every expression from literals, annotations and library stubs, follows values through assignments and calls, and reports mismatches with a code (`[arg-type]`) and a line. Unannotated functions are checked as taking and returning `Any` by default — which means their bodies are barely checked — so a codebase gets value in proportion to how much of its public surface is hinted. It does not run the code, so it cannot know a list is empty or a file is missing; it checks *shape*, not *state*.

## Narrowing

The most useful thing a checker does is refuse to let an `X | None` be used before it is tested, and the tests it understands are called narrowing:

```python
def size(x: int | None) -> int:
    if x is None:               # after this line, x is int
        return 0
    return x.bit_length()

def describe(v: int | str) -> str:
    if isinstance(v, int):      # v is int here
        return f"{v:d}"
    return v.upper()            # and str here

def first(xs: list[str]) -> str:
    assert xs, "empty"          # assert narrows too (and, unlike an if, does not change control flow)
    return xs[0]

match cmd:
    case str():                 # class patterns narrow
        ...
```

`is None`/`is not None`, `isinstance`, `callable`, truthiness on `X | None`, `in` against a `Literal` tuple, early `return`/`raise` in a branch, and `match` class patterns all narrow. A custom test function does not — unless it is declared `-> TypeGuard[T]` (3.10), which tells the checker "when this returns `True`, the argument is a `T`".

## cast, reveal_type, ignore

```python
from typing import cast, reveal_type

value = cast(int, some_object_the_checker_thinks_is_Any)   # no run-time effect; asserts the type to the checker
reveal_type(value)                                          # the checker prints the inferred type (3.11 built-in; remove afterwards)
result = legacy_call()  # type: ignore[no-untyped-call]     # silence one error, with its code
```

`cast` is a promise, not a check — if it is wrong, the run-time error appears somewhere else. `reveal_type` is the debugging tool for "what does the checker think this is?". A `# type: ignore` with the error code in brackets is the honest way to accept a known limitation; a bare `# type: ignore` hides everything on that line.

## TYPE_CHECKING and forward references

```python
from __future__ import annotations          # annotations become strings, evaluated lazily
from typing import TYPE_CHECKING

if TYPE_CHECKING:                           # imports only the checker sees — breaks import cycles and avoids heavy imports
    from .models import User

def greet(user: User) -> str: ...

class Node:
    def link(self, other: Node) -> None: ...   # a class referring to itself: fine with the future import
```

`from __future__ import annotations` (3.7) stores every annotation as a string instead of evaluating it, which allows forward references and cheap imports; `typing.get_type_hints(obj)` evaluates them back to objects when a library needs the real types at run time (libraries that validate data at run time rely on it).

## Strictness

`mypy --strict` turns on the checks that matter for a mature codebase: every function must be annotated (`disallow-untyped-defs`), calls into unannotated code are errors, `Any` returns are flagged, and optional values must be handled. New projects should start strict; existing ones tighten one flag at a time, per package, with a `[tool.mypy]` table in `pyproject.toml` (Module 12). The checker also needs types for third-party libraries: most ship them inline (a `py.typed` marker) or as `types-*` stub packages; `ignore_missing_imports` bridges the gap.

## Hints at run time

```python
def area(w: float, h: float) -> float: ...
area.__annotations__                    # {'w': <class 'float'>, 'h': <class 'float'>, 'return': <class 'float'>}
import typing, inspect
typing.get_type_hints(area)             # the same, with string annotations resolved
inspect.signature(area).parameters["w"].annotation
```

Nothing in the interpreter checks them, but libraries do: `dataclasses` builds fields from them, `functools.singledispatch` registers by them, `argparse`-like tools (`typer`), validation libraries (`pydantic`) and serialisers read them. Module 4's checker exercise was the small version of that idea. The rule: annotations are data about the code, available to any tool that wants them, enforced by none unless it chooses to.

## The workflow

Write hints as you write functions — the signature is the cheapest place; run the checker in the editor and in CI (`mypy src/`), treat its errors as bugs to fix or limitations to annotate with a coded ignore, and use `reveal_type` when a union does not narrow as expected. A checker's errors are usually right: a `None` it will not let you dereference is a `None` your code was about to crash on.

## Pitfalls

- Believing a passing check means correct behaviour; it means consistent types.
- Unannotated functions, which the checker treats as `Any` and skips.
- Testing with `== None` (narrows) versus a helper `is_missing(x)` (does not, without `TypeGuard`).
- Bare `# type: ignore` hiding new errors on the same line.
- `cast` used to silence an error that is real.
- Forgetting `from __future__ import annotations` when a class refers to itself in a hint (or quoting it: `"Node"`).

## Key takeaways

- A checker verifies type consistency without running the code; hint the public surface or it checks little.
- `is None`, `isinstance`, `assert`, early returns and `match` narrow unions; `TypeGuard` lets a custom test narrow.
- `cast` asserts to the checker only; `reveal_type` shows its inference; `# type: ignore[code]` accepts a known limitation.
- `TYPE_CHECKING` and `from __future__ import annotations` handle cycles and forward references; `get_type_hints` resolves strings at run time.
- Run `mypy --strict` in the editor and CI; annotations are data that libraries read and the interpreter ignores.
