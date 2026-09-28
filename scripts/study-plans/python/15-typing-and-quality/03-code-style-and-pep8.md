---
title: Code style and PEP 8 — layout, naming, imports, docstrings and the tools that enforce them
minutes: 13
seo-title: What Is PEP 8? Python Style Guide, Naming and Docstrings
description: PEP 8 is Python's style guide: four-space indents, snake case functions, PascalCase classes and PEP 257 docstrings, enforced by ruff and black.
question: What is PEP 8 in Python?
answer: PEP 8 is the style guide for Python code, published in 2001 and followed across the Python community. It sets layout (four-space indentation, a line-length limit, two blank lines between top-level definitions), naming (`snake_case` functions, `PascalCase` classes, `UPPER_SNAKE` constants) and import order. Linters and formatters such as `ruff` and `black` now check or apply most of it automatically.
q: What is the maximum line length in PEP 8?
a: PEP 8 sets 79 characters, and 72 for docstrings and comments. Many projects choose 88, black's default, or 100, and record the choice in `pyproject.toml`. What matters is having one agreed limit, not the particular number.
q: What are the Python naming conventions?
a: `snake_case` for functions, methods and variables; `PascalCase` for classes and exceptions; `UPPER_SNAKE` for constants; short `lowercase` names for modules; a leading underscore for internal names; and a trailing underscore, as in `class_`, to avoid a keyword. Never use `l`, `O` or `I` as single-character names.
q: What is the difference between ruff and black?
a: `ruff` is a linter: it finds problems such as unused imports, undefined names, `== None`, bare `except` and mutable defaults, and `ruff check --fix` repairs the safe ones. `black`, like `ruff format`, is a formatter that rewrites layout into one canonical form. Most projects run both, in the editor and in CI.
q: How do you write a docstring in Python?
a: Following PEP 257, use triple double quotes and start with a one-line summary in the imperative that ends with a full stop, then a blank line, then what a caller needs: arguments the names do not explain, the return value and exceptions raised. Google and NumPy styles add structured sections.
---
PEP 8 is the style guide the Python community converged on in 2001 and has followed since; reading code that follows it costs nothing, and reading code that does not costs a little on every line. The guide's rules fall into layout, naming, expressions and imports, and nearly all of them are now enforced or applied automatically by two tools — `ruff` (a linter) and `black` or `ruff format` (a formatter) — so the human part is knowing *why* the rules exist and the few that a tool cannot decide for you. This lesson covers the rules that matter, the PEP 257 docstring conventions, the linter/formatter workflow, and what "readable" means beyond compliance.

## Layout

- **Four spaces** per indent level, never tabs.
- **Line length 79** by PEP 8; most projects choose 88 (black's default) or 100 and say so in `pyproject.toml`. The point is a limit, not the number.
- **Two blank lines** before top-level `def`/`class`; **one** between methods.
- **Spaces** around binary operators and after commas; none inside brackets or before a call's parentheses: `f(a, b)`, `x = y + 1`, `xs[i]`, `d = {"k": v}`. No spaces around `=` in keyword arguments and defaults: `f(x=1)`, `def g(n=0)`.
- **Line breaks** inside brackets, with a trailing comma when items go one per line.
- **Imports** at the top, one per line, grouped standard library / third-party / local, each group alphabetical (Module 12).

## Naming

| Kind | Style | Example |
| --- | --- | --- |
| modules, packages | `lowercase`, short | `parser.py`, `shop/` |
| functions, methods, variables | `snake_case` | `total_price`, `is_valid` |
| classes, exceptions | `PascalCase` | `OrderItem`, `ValidationError` |
| constants | `UPPER_SNAKE` | `MAX_RETRIES` |
| internal names | `_leading_underscore` | `_cache` |
| avoid clashing with a keyword | trailing underscore | `class_` |
| single-character loop indexes | `i`, `j`, `k`; never `l`, `O`, `I` | |

Names describe *what*, not *how*: `active_users` not `list_of_users_filtered`; `is_`/`has_`/`can_` prefixes for booleans; verbs for functions that act (`save`, `parse`), nouns or adjectives for those that compute (`total`, `is_valid`); no type in the name (`users_list`, `str_name`) — the hint says the type.

## Expressions

```python
if not xs:                     # not: if len(xs) == 0
if x is None:                  # not: if x == None
if flag:                       # not: if flag == True
if isinstance(x, int):         # not: if type(x) == int
value = d.get(key, default)    # not: if key in d: ... else: ...
"".join(parts)                 # not: s += part in a loop
for i, x in enumerate(xs):     # not: for i in range(len(xs))
with open(...) as f:           # always
```

Comparisons to singletons use `is`; truthiness replaces explicit emptiness checks; comprehensions replace `map`/`filter` with lambdas; `return` a value rather than mutating and returning `None` unless the method's job is mutation.

## Docstrings (PEP 257)

```python
def parse_duration(text: str) -> int:
    """Return the number of seconds denoted by `text`, such as "1h30m".

    Units are h, m and s, each optional, in that order. Raises ValueError
    for anything else, including a negative or empty value.
    """
```

Triple double quotes; a one-line summary in the imperative that fits on the first line and ends with a full stop; a blank line; then details a caller needs — arguments whose meaning the names do not convey, the return value's shape, exceptions raised. Public modules, classes and functions get docstrings; a private helper may have one line or none. Google style (`Args:`/`Returns:`/`Raises:` sections) and NumPy style are structured variants documentation tools render; pick one per project. A docstring is not a comment: comments explain *why* a piece of code is the way it is, docstrings explain *what* a function does for its caller.

## Comments

A comment earns its place by saying something the code cannot: the reason for a non-obvious choice, a reference to a specification or an issue, an invariant a loop maintains, a warning about a trap. `# increment i` is noise; `# retry once: the first call after wake-up fails on this firmware` is worth its line. Delete commented-out code — version control remembers it. A `TODO` names an owner and a reason.

## The tools

- **`ruff check .`** — a linter: unused imports and variables, undefined names, comparisons to `None` with `==`, mutable defaults, bare `except`, shadowed built-ins and hundreds more, in milliseconds; `ruff check --fix` repairs what is safe. It subsumes `flake8`, `pyflakes`, `isort` and most of `pylint`.
- **`ruff format .`** or **`black .`** — a formatter: rewrites layout (spacing, line breaks, quotes) to one canonical form, so style is never discussed in review. Both are deliberately unconfigurable beyond line length.
- **`mypy`** — types (previous lesson).
- **`pre-commit`** — runs them on every commit; CI runs them on every push.

Configuration lives in `pyproject.toml` (`[tool.ruff]`, `[tool.black]`), so a checkout carries its rules. The workflow is: write, save, the editor formats and lints, fix what is flagged, commit. Style stops being a matter of taste and becomes a property of the repository.

## Beyond compliance

PEP 8-clean code can still be unreadable. The judgement calls a tool cannot make: a function that does one thing and is named for it; a module with a single purpose; early returns instead of nesting (Module 3); no clever one-liners where two clear lines would do; data structures chosen so the code that uses them is simple; consistency with the surrounding code above consistency with your preference. "Readability counts" is the Zen's line, and the test is whether a reader who did not write it can predict what it does from its shape.

## Pitfalls

- Tabs, or mixed indentation.
- `== None`, `== True`, `type(x) == T`, `len(xs) == 0`.
- Names with types in them, or single letters outside a loop index.
- Commented-out code and `# obvious` comments.
- Ignoring the linter, or disabling rules globally to silence it.
- Reformatting files you did not otherwise change (noisy diffs).

## Key takeaways

- Four spaces, a line limit, two blank lines between top-level definitions, spaces around operators, imports grouped at the top.
- `snake_case` functions, `PascalCase` classes, `UPPER_SNAKE` constants, `_internal` names; describe what, not how or type.
- `is None`, truthiness, `isinstance`, `get`, `join`, `enumerate`, `with` — the idioms PEP 8 expects.
- PEP 257 docstrings: imperative summary, blank line, details; comments say why.
- `ruff` lints, `black`/`ruff format` formats, `mypy` types, `pre-commit` and CI run them; configure in `pyproject.toml`.
