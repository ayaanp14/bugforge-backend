---
title: EAFP and exception-driven flow — suppress, retries, return versus raise
minutes: 13
---
Python raises exceptions for conditions other languages treat as ordinary results: the end of an iterator is `StopIteration`, a missing key is `KeyError`, a missing attribute is `AttributeError`. The language is designed for code that *tries* and *handles*, and the `try` statement is cheap to enter — the cost is in raising, not in guarding. This lesson works through the consequences: the EAFP patterns the standard library expects, `contextlib.suppress` for the "ignore this if it happens" case, when a function should return `None` and when it should raise, sentinel results, retry loops, and the two rules that keep exception-driven code from becoming exception-obscured code.

## The cost model

Entering a `try` block costs essentially nothing (since 3.11, literally zero instructions at run time — the handler table is static). Raising and catching costs on the order of a microsecond: building the exception object, unwinding, matching. So:

- A `try` around an operation that *usually succeeds* is faster than a pre-check, because the check runs every time and the raise almost never.
- A `try` around an operation that *usually fails* is slower than a check, because every failure pays for a raise.

The judgement is about frequency, not style. `int(token)` on user input that is nearly always numeric: EAFP. Testing whether half the tokens are numbers: LBYL with a cheap check, or EAFP if the check would be as expensive as the conversion.

## The patterns the library expects

```python
try:                                   # membership with a side effect
    value = cache[key]
except KeyError:
    value = cache[key] = compute(key)

try:                                   # optional attribute
    hook = obj.on_close
except AttributeError:
    hook = None

try:                                   # first element, or a default
    first = next(iterator)
except StopIteration:
    first = None
first = next(iterator, None)           # the same, built in

try:                                   # a file that may not exist
    with open(path) as f:
        text = f.read()
except FileNotFoundError:
    text = ""
```

The file case is the canonical argument for EAFP: `os.path.exists(path)` followed by `open(path)` has a window in which the file can vanish, and the check duplicates the work `open` does anyway. The library's own conveniences — `dict.get`, `getattr(obj, name, default)`, `next(it, default)`, `str.find` — are EAFP folded into a call, and are preferable to hand-written `try` blocks when they exist.

## contextlib.suppress

```python
from contextlib import suppress

with suppress(FileNotFoundError):
    os.remove(path)                    # delete if present; silently fine if not

with suppress(KeyError):
    del cache[key]
```

`suppress(*exceptions)` is `try: … except X: pass` as a context manager, for the one legitimate use of an empty handler: an operation whose failure means "already in the desired state". It names the exception, so it cannot become a bare `except`, and its block should be one statement.

## Return None or raise?

A function that looks something up and may not find it has two honest designs, and the choice is about what "not found" *means* to the caller:

- **Return `None`** (or an empty collection) when absence is a *normal outcome* the caller expects to test: `dict.get`, `re.match`, `find`. The return type is `X | None`, and the caller must check.
- **Raise** when absence is *exceptional* — the caller passed something that should have existed — so that forgetting to handle it is a loud failure rather than a `None` that surfaces three calls later as `AttributeError: 'NoneType'`.

Offer both when the function is general: `find(x)` returning `None` and `index(x)` raising, as `str` does. Never return a *plausible* value (`0`, `""`, `-1`) as an error code from a function whose real results could be that value; that is the design exceptions exist to replace.

## Sentinels

When `None` is itself a valid value, a private sentinel distinguishes "absent" from "present and None":

```python
_MISSING = object()

def get(self, key, default=_MISSING):
    try:
        return self._data[key]
    except KeyError:
        if default is _MISSING:
            raise
        return default
```

`object()` is unique and compares only by identity, which is exactly what a sentinel needs. The same pattern appears in `dataclasses.MISSING` and in every library that must tell "no argument given" from "argument given as `None`".

## Retry loops

```python
def fetch_with_retries(fetch, attempts=3):
    for attempt in range(1, attempts + 1):
        try:
            return fetch()
        except TransientError as e:
            if attempt == attempts:
                raise
            log(f"attempt {attempt} failed: {e}")
    # unreachable: the loop either returned or re-raised
```

Retry only the exceptions that mean "try again" (a timeout, a lock conflict), never a `ValueError` that will fail identically; cap the attempts; re-raise the last failure so the caller sees a real error, not a `None`. Real systems add a delay between attempts (`time.sleep`, with backoff) — omitted here because nothing in a judged program should wait.

## Two rules

**Catch the narrowest exception that expresses the case you handle.** `except KeyError` for a missing key, not `except Exception`; a `try` that catches more than it means to will one day catch a genuine bug and treat it as "key missing".

**Keep the handler near the operation and the block small.** A `try` around one call reads as "this call may fail thus"; a `try` around a function body reads as "something in here might go wrong", which tells the reader nothing and the maintainer less.

## Pitfalls

- EAFP on an operation that fails half the time — measure, or check.
- `except Exception: pass` where `suppress(SpecificError)` around one statement was meant.
- Returning `None` from a function whose callers never check it.
- Returning `-1`, `0` or `""` to signal failure.
- Retrying non-transient errors, or retrying forever.
- Using `None` as a sentinel when `None` is a legitimate value.

## Key takeaways

- `try` is free to enter; raising costs ~1 µs — EAFP for the usually-successful case, a check for the usually-failing one.
- Prefer the built-in defaulted forms (`get`, `getattr`, `next(it, default)`) to hand-written handlers.
- `contextlib.suppress(X)` is the named, one-statement form of "ignore this failure".
- Return `None` when absence is a normal outcome the caller will test; raise when it is exceptional; never a plausible error code.
- A private `object()` sentinel tells absent from `None`; retry only transient failures, capped, and re-raise the last.
