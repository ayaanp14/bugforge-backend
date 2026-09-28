---
title: Type hints and docstrings — the contract a function publishes
minutes: 12
seo-title: Python Type Hints Explained: Annotations and Docstrings
description: Python type hints record what a function takes and returns, yet nothing checks them at run time. Generic and optional hints, Callable and PEP 257 docstrings.
question: What are type hints in Python?
answer: Type hints are annotations that record what kinds of values a Python function takes and returns, as in `def area(width: float, height: float) -> float:`. The interpreter stores them in `__annotations__` and does not check them at run time; static checkers such as `mypy` and `pyright`, editors, and libraries such as dataclasses and pydantic are what read them.
q: Does Python enforce type hints at run time?
a: No. The interpreter stores annotations and otherwise ignores them: no conversion, no check, no error, so `area("3", 4)` fails inside the multiplication rather than at the hint. A static checker such as `mypy` or `pyright` reports the mistake before the program runs.
q: How do I type hint an optional value in Python?
a: Write `int | None` (Python 3.10 and later), or `Optional[int]` from `typing` in older code. It means the value may be `None`, not that the parameter may be left out — an optional parameter is one with a default. A checker then insists the caller tests for `None` before using the result.
q: How do I type hint a list or dict in Python?
a: Since Python 3.9 the built-in collections are generic: `list[int]`, `dict[str, int]`, `tuple[int, str]` for exactly two items and `tuple[int, ...]` for any length. For parameters, prefer the wider abstract types from `collections.abc`, such as `Iterable[int]` or `Mapping[str, int]`, which accept more than one concrete type.
q: How do you write a good docstring in Python?
a: Follow PEP 257: a one-line summary in the imperative mood, such as "Return the averages of…", ending in a full stop; then a blank line and the details a caller needs — unclear parameters, the result, the exceptions raised, any side effects. Use triple double quotes and never restate the signature.
---
A function's signature says what it takes; its docstring says what it does; its type hints say what kinds of values go in and come out. None of the three is enforced by the interpreter — Python will happily call `area("3", 4)` and fail inside — but together they are the contract that editors complete against, that `mypy` checks, that `help()` displays, and that the next reader relies on. This lesson introduces annotations and the built-in generic syntax, states what hints do and do not do at run time, and fixes the docstring conventions; Module 15 goes deep on the type system.

## Annotations

```python
def area(width: float, height: float) -> float:
    return width * height

def greet(name: str, times: int = 1) -> str:
    return f"Hello, {name}! " * times
```

`name: type` annotates a parameter; `-> type` annotates the return. The annotations are stored in `area.__annotations__` (`{'width': float, 'height': float, 'return': float}`) and otherwise ignored: no conversion, no check, no error. `area("3", 4)` raises `TypeError` from the multiplication, not from the hint. Variables can be annotated too — `total: int = 0`, or `count: int` with no value, which declares without binding.

## The hint vocabulary

Since 3.9 the built-in collections are their own generics, and since 3.10 `|` writes a union:

| Hint | Meaning |
| --- | --- |
| `int`, `str`, `float`, `bool`, `bytes` | that type (an `int` hint also accepts `bool`; a `float` hint accepts `int`) |
| `list[int]` | a list whose elements are ints |
| `dict[str, int]` | a dict from str keys to int values |
| `tuple[int, str]` | a two-tuple of exactly those types |
| `tuple[int, ...]` | a tuple of any length of ints |
| `set[str]`, `frozenset[str]` | sets |
| `int \| None` | an int or `None` — the optional value (older code: `Optional[int]`) |
| `int \| str` | either (older: `Union[int, str]`) |
| `Any` (from `typing`) | anything; switches checking off for that value |
| `Callable[[int, str], bool]` (from `collections.abc`) | a function taking an int and a str, returning a bool |
| `Iterable[int]`, `Sequence[int]`, `Mapping[str, int]` (from `collections.abc`) | anything iterable / indexable / dict-like — the right hints for *parameters*, because they accept more than `list` |
| `None` | as a return: the function returns nothing |

The rule for parameters is to accept the *widest* type that works (`Iterable[int]` rather than `list[int]` if you only loop over it) and to return the *narrowest* concrete type you actually produce (`list[int]`).

```python
from collections.abc import Iterable, Callable

def total(xs: Iterable[int]) -> int:
    return sum(xs)

def apply_all(fs: list[Callable[[int], int]], x: int) -> list[int]:
    return [f(x) for f in fs]

def find(xs: list[str], target: str) -> int | None:
    return xs.index(target) if target in xs else None
```

`int | None` is the honest return type of a lookup that can fail, and the checker will insist the caller test for `None` before using the result — which is the bug that hint exists to catch.

## What hints buy you

- **Editor completion**: with `s: str`, typing `s.` lists string methods.
- **Static checking**: `mypy program.py` or `pyright` reports `area("3", 4)` as an error before the program runs, and follows `None` through every path.
- **Documentation**: the signature says `-> int | None` where a docstring would have to spell it out.
- **Run-time introspection**: `dataclasses` builds fields from annotations; `typing.get_type_hints` resolves them; libraries such as pydantic and FastAPI validate real data against them.

What they cost is a few characters per parameter and the discipline to keep them true; a wrong hint is worse than none. A function in a judged exercise is fine with or without them; a function in a codebase is expected to have them at its public boundary.

## Docstrings

```python
def moving_average(xs: list[float], window: int) -> list[float]:
    """Return the averages of each consecutive `window` values of `xs`.

    The result has `len(xs) - window + 1` entries. Raises ValueError if
    `window` is less than 1 or greater than `len(xs)`.
    """
```

PEP 257's rules: a one-line summary in the imperative mood ("Return…", "Compute…", "Raise…"), ending in a full stop, fitting on the first line; a blank line; then details — the meaning of parameters where the names do not say it, the shape of the result, the exceptions raised, any side effects. Triple double quotes, closing quotes on their own line for multi-line docstrings. The summary should not repeat the signature ("takes a list and an int") — the reader can see that — but say what the function *means*. `help(moving_average)` prints the signature and the docstring; `moving_average.__doc__` is the text.

Google-style and NumPy-style docstrings add structured `Args:` / `Returns:` / `Raises:` sections that documentation tools render; pick one style per project. For a private helper, one line is enough; for a function others will call, write the contract.

## Reading a signature with everything

```python
def search(
    items: Sequence[str],
    query: str,
    *,
    limit: int | None = None,
    key: Callable[[str], str] = str.lower,
) -> list[str]:
    """Return the items matching `query`, at most `limit` of them."""
```

Positional inputs, keyword-only options after `*`, hints on each, a default that is a function, a return hint, a docstring. That is what a function in a well-kept codebase looks like, and every piece of it has been introduced in this module.

## Pitfalls

- Believing a hint converts or checks at run time. It does neither.
- `list` where `Iterable` would accept a tuple, a set or a generator too.
- Forgetting `| None` on a return that can be `None`; the checker cannot then catch the missing test.
- `Optional[int]` meaning "the parameter is optional" — it means "may be `None`"; an optional parameter is one with a default.
- A docstring that restates the code or the signature.
- Mutable default values hinted as `list[int] = []` — the hint does not fix the shared default.

## Key takeaways

- `param: type` and `-> type` record the contract; the interpreter stores and ignores them.
- `list[int]`, `dict[str, int]`, `tuple[int, ...]`, `X | None`, `Callable[[…], R]`, and `Iterable`/`Sequence`/`Mapping` for parameters.
- Hints pay in editor completion, static checking and documentation; keep them true.
- A docstring is an imperative one-line summary, a blank line, then the details a caller needs.
- Accept the widest parameter type that works, return the narrowest concrete one.
