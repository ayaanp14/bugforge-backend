---
title: Checkpoint — Type hints and code quality
minutes: 22
seo-title: Python Type Hints Quiz: mypy, PEP 8 and Logging Practice
description: Test yourself: 12 questions and three programs on Python type hints and narrowing, PEP 8 naming, logging levels and handlers, and Pythonic idioms.
q: Which type hint accepts a list, a tuple and a generator, and which requires indexing?
a: `Iterable[int]` accepts all three, because each can be looped over; use it when a function only iterates. `Sequence[int]` requires indexing and slicing, so it accepts lists and tuples but not a generator. Both come from `collections.abc`.
q: How does an `is None` test change what a type checker allows?
a: It narrows the type. After `if x is None: return 0`, a value hinted `int | None` is treated as `int` for the rest of the function, so calling an `int` method on it, which was an error before the test, is allowed.
q: Why must a library never call `logging.basicConfig`?
a: Configuring handlers, levels and formats belongs to the application that imports the library, which does it once at start-up. A library that calls `basicConfig` hijacks the application's output and can make the application's own later call a silent no-op, since `basicConfig` does nothing once the root logger has handlers.
---
This checkpoint covers the whole module: the hint vocabulary — built-in generics, unions, `Callable`, `TypeVar`, `Generic`, `ClassVar`, `Final`, `Literal`, `TypedDict`, `NewType` — with parameters hinted wide and returns narrow; what a type checker verifies and how narrowing, `cast`, `TYPE_CHECKING` and `get_type_hints` work; PEP 8 layout, naming, docstrings and the linter/formatter workflow; `logging` with levels, the logger hierarchy, formats and handlers; and the idioms and anti-patterns that make code Pythonic.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Which hint accepts a list, a tuple and a generator of ints, and which requires indexing?
- What does `Optional[int]` mean, and what does it not mean?
- How does an `is None` test change what the checker allows afterwards?
- Which naming style applies to functions, classes and constants?
- Why must a library never call `logging.basicConfig`?
- Why write `log.debug("%s", x)` rather than an f-string?
- Which five anti-patterns hide bugs rather than just looking foreign?

The three programs are a run-time validator driven by `get_type_hints` that handles unions and `Literal`s, a linter-lite that flags PEP 8 naming and idiom violations line by line, and a logging pipeline whose records are routed by level to two in-memory handlers with different formats.
