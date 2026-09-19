---
title: Checkpoint — Type hints and code quality
minutes: 22
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
