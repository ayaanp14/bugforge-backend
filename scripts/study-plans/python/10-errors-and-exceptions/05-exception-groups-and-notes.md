---
title: Exception groups, notes and the traceback module
minutes: 13
---
Python 3.11 added two things to exceptions. `ExceptionGroup` carries *several* exceptions at once — the failures of several concurrent tasks, or every validation error in a form — and `except*` handles them by type without losing the rest. `add_note()` attaches context to an exception as it travels up the stack, so the traceback says *which* record was being processed when the `ValueError` happened. This lesson covers both, then the `traceback` module for capturing and formatting exceptions as text, `sys.exc_info`, and the `warnings` module for the failures that are not errors yet.

## ExceptionGroup

```python
errors = []
for i, row in enumerate(rows):
    try:
        validate(row)
    except ValueError as e:
        e.add_note(f"row {i}")
        errors.append(e)
if errors:
    raise ExceptionGroup("validation failed", errors)
```

An `ExceptionGroup(message, [exceptions])` is itself an exception (a subclass of `Exception`; `BaseExceptionGroup` for the `BaseException` family) whose `.exceptions` tuple holds the members. Raised, it prints a tree traceback showing every member. It replaces the older habits of raising only the first error or stuffing a list into one exception's message. `asyncio.TaskGroup` (Module 17) raises one when several tasks fail.

## except*

```python
try:
    process_all(rows)
except* ValueError as group:
    print(f"{len(group.exceptions)} value errors")
except* KeyError as group:
    print(f"{len(group.exceptions)} key errors")
```

`except*` matches *members* of a group by type: each clause receives a new `ExceptionGroup` containing only the matching members (even when only one matched), and every clause whose type matches something runs — unlike `except`, where exactly one handler runs. Members that match no clause are re-raised as a smaller group after the handlers. `except*` also handles a plain, non-group exception by wrapping it. `except` and `except*` cannot be mixed in one `try`.

Two methods help without `except*`: `group.subgroup(ValueError)` returns the matching part (or `None`), `group.split(ValueError)` returns `(matching, rest)`. Nested groups are flattened by both.

## add_note

```python
def load(path):
    try:
        return parse(open(path).read())
    except ValueError as e:
        e.add_note(f"while loading {path}")
        raise
```

`add_note(text)` appends to `e.__notes__`, and every note prints under the exception in the traceback. It is the right tool for adding context *without* changing the exception's type or wrapping it — the caller still catches `ValueError`, and the traceback still says where it was raised, but now also says what was being done. Before 3.11 the same need was met by re-raising a new exception `from e`, which changed the type callers had to catch.

## Handling a group without except*

Code that must also run on 3.10 catches the group as an ordinary exception and inspects it: `except ExceptionGroup as g:` then `for e in g.exceptions:` to walk the members (nested groups have their own `.exceptions`), or `g.subgroup(ValueError)` to keep one type. `except*` is the cleaner spelling, but the group is a normal object and everything it offers is reachable by hand — including re-raising a filtered part with `raise g.subgroup(...)` after handling the rest.

## The traceback module

```python
import traceback, sys

try:
    risky()
except Exception:
    text = traceback.format_exc()          # the full traceback as a string
    log(text)

traceback.print_exc()                      # print it to stderr
traceback.format_exception(e)              # a list of lines from an exception object (3.10 signature)
"".join(traceback.format_exception_only(e))   # just the last line: 'ValueError: bad\n'
```

`format_exc()` inside a handler is how a program records a failure it is going to survive — a worker that must keep processing the queue, a server that answers the next request. `sys.exc_info()` returns `(type, value, tb)` for the exception being handled; since 3.11 `sys.exception()` returns just the instance. `e.__traceback__` is the traceback object on the exception itself; `e.with_traceback(tb)` attaches one.

Notes, the cause (`__cause__`, set by `from`), the context (`__context__`, set automatically when raising inside a handler) and the `__suppress_context__` flag (set by `from None`) are all attributes of the exception object that the traceback printer reads.

## Logging exceptions

`logging.exception("message")` (Module 15) logs at ERROR level *with the traceback appended* and must be called from inside a handler. It is `log.error(..., exc_info=True)` spelled out, and it is what a boundary handler should call instead of `print(e)` — `str(e)` alone loses the type and the location.

## Warnings

A warning is a condition worth telling the developer about that is not an error: a deprecated API, a probable mistake (`SyntaxWarning: "is" with a literal`), a resource left open.

```python
import warnings

def old_api():
    warnings.warn("old_api is deprecated; use new_api", DeprecationWarning, stacklevel=2)

with warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always")
    old_api()
    print(caught[0].message)
```

Warnings go to stderr once per location by default; `python -W error` turns them into exceptions (which is how a test suite fails on deprecation); `warnings.filterwarnings` configures them; `catch_warnings(record=True)` captures them in a test. `stacklevel=2` makes the warning point at the caller rather than at the `warn` line.

## Pitfalls

- Raising only the first of many failures when a group would report them all.
- Mixing `except` and `except*` in one `try` (a `SyntaxError`).
- Expecting `except* ValueError as e` to bind a `ValueError` — it binds a group.
- Wrapping an exception in a new type just to add context, when `add_note` keeps the type.
- `print(e)` at a boundary instead of `traceback.format_exc()` or `logging.exception`.
- Warnings in a library that a user cannot silence — always pass a category and `stacklevel`.

## Key takeaways

- `ExceptionGroup(msg, [excs])` raises several exceptions at once; `.exceptions`, `.subgroup`, `.split` inspect it.
- `except* T` handles the matching members as a sub-group; every matching clause runs; unmatched members re-raise.
- `e.add_note(text)` adds context to the traceback without changing the exception's type.
- `traceback.format_exc()` captures the current traceback as text; `logging.exception` logs it; `__cause__`/`__context__`/`__notes__` are the attributes behind the printout.
- `warnings.warn(msg, Category, stacklevel=2)`; `-W error` promotes warnings to exceptions; `catch_warnings(record=True)` captures them.
