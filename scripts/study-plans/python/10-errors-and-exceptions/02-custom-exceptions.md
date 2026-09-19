---
title: Custom exceptions — a hierarchy for your own errors
minutes: 13
---
The built-in exceptions describe *what kind* of thing went wrong — a bad value, a missing key — but not *whose* code it went wrong in. A library or application that raises `ValueError` for everything leaves its callers unable to tell a malformed input from a failed business rule from a bug. Custom exception classes solve that: a base class for the package, subclasses for the distinct failures, fields that carry what the handler needs, and a message that reads well. This lesson covers defining them, adding data, building a small hierarchy, writing messages, and the rules for when a custom exception earns its place versus when a built-in is the honest choice.

## The minimal custom exception

```python
class InsufficientFunds(Exception):
    pass

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFunds(f"balance {balance}, requested {amount}")
    return balance - amount

try:
    withdraw(10, 50)
except InsufficientFunds as e:
    print("declined:", e)          # declined: balance 10, requested 50
```

Subclass `Exception` (never `BaseException`), give it a name that ends in `Error` or reads as a condition, and it is done: the message passed to the constructor is stored in `e.args` and shown by `str(e)`. A `pass` body is enough — the class's identity is its content.

## Carrying data

When handlers need to *act* on details, store them as attributes rather than making callers parse the message:

```python
class InsufficientFunds(Exception):
    def __init__(self, balance, requested):
        super().__init__(f"balance {balance}, requested {requested}")
        self.balance = balance
        self.requested = requested

    @property
    def shortfall(self):
        return self.requested - self.balance

try:
    withdraw(acct, 50)
except InsufficientFunds as e:
    offer_overdraft(e.shortfall)
```

Call `super().__init__` with the message so that `str(e)`, the traceback and `e.args` behave normally, then set your own attributes. A dataclass-style exception (`@dataclass class X(Exception)`) is possible but fiddly with `args`; the explicit `__init__` is the convention.

## A hierarchy

```python
class AppError(Exception):
    """Base for every error this application raises on purpose."""

class ConfigError(AppError):
    pass

class ValidationError(AppError):
    def __init__(self, field, message):
        super().__init__(f"{field}: {message}")
        self.field = field

class NotFound(AppError):
    pass
```

One base per package or application, one subclass per *distinct handling*. The base lets a boundary catch "anything we raised deliberately" (`except AppError`) separately from bugs (`except Exception` — a `TypeError` from a typo is not an `AppError`), and the leaves let specific code handle specific failures. Do not create a subclass for every message; create one when some caller will catch it *differently* from its siblings.

Multiple inheritance from a built-in is legitimate when the custom exception *is* a kind of built-in error too: `class ConfigKeyError(ConfigError, KeyError)` is caught by both `except ConfigError` and `except KeyError`, which keeps old callers working while new ones use the specific class.

## Messages

The message is read by a human in a traceback or a log, so: say what was expected and what arrived (`f"port must be 1–65535, got {port}"`), name the thing (`f"user {user_id} not found"`), avoid duplicating what the class name already says, and do not end with a full stop or capitalise like a sentence — `ValueError: invalid literal for int() with base 10: 'x'` is the house style. Never put the fix in the message unless it is certain; put the context.

## When not to define one

- **A built-in already means it.** A bad argument is `ValueError` or `TypeError`; a missing key is `KeyError`; a missing file is `FileNotFoundError`. Callers already know how to handle those, and a `MyValueError` that nobody catches differently is noise.
- **Nobody will catch it.** An exception that only ever ends the program with a traceback gains nothing from a custom class.
- **It is control flow inside one function.** Use a return value or a `break`.

Define one when callers *outside your module* need to distinguish your failure from others, when handlers need structured data, or when a package wants one base to catch.

## Translating at a boundary

A library that calls another library should not leak the inner one's exceptions: a caller of `load_config` wants `ConfigError`, not `json.JSONDecodeError` or `KeyError` from whatever the implementation happens to use today. The pattern is a small `try` at the boundary that catches the inner exception and raises the outer one `from` it — the cause stays visible in the traceback for debugging, but the *type* the caller must catch is stable across implementation changes. Do the translation once, at the edge of the module; deeper code raises whatever is natural.

## Documenting and testing

A function's docstring should list what it raises (`Raises ValidationError if …`), because raising is part of the contract. Tests assert the class and, when it matters, the fields:

```python
try:
    validate({"age": -1})
except ValidationError as e:
    assert e.field == "age"
else:
    raise AssertionError("expected ValidationError")
```

`unittest`'s `assertRaises` and pytest's `pytest.raises` (Module 18) are the same check with less ceremony.

## Pitfalls

- Subclassing `BaseException` — it escapes `except Exception` and behaves like `KeyboardInterrupt`.
- A custom `__init__` that forgets `super().__init__(message)`, leaving `str(e)` empty.
- A class per message rather than per handling.
- Callers parsing `str(e)` because the data was not stored as attributes.
- Wrapping a built-in in a custom exception without `from e`, losing the cause.
- Naming: `ErrorHappened`, `MyException` — name the condition.

## Key takeaways

- Subclass `Exception`, name the condition, pass a message to `super().__init__`; a `pass` body is often enough.
- Store details handlers need as attributes; the message is for humans.
- One base class per package, one subclass per distinct handling; inherit from a built-in too when it is a kind of that error.
- Messages say what was expected and what arrived, in the built-ins' lower-case style.
- Prefer a built-in when it already means the failure; define your own when callers must tell it apart or need its data.
