---
title: Assertions and defensive code — validate at the boundary, assert the invariant
minutes: 13
---
There are two kinds of "this should not happen": input from outside the program that turns out to be wrong, and a state inside the program that the code's own logic should have made impossible. They need different tools. Bad input is *expected* and is handled by validation that raises a clear exception; an impossible state is a *bug* and is caught by an `assert` that documents the assumption and fails loudly in development. This lesson separates the two, explains what `assert` is and is not (it can be switched off), gives the validation rules for a boundary, and closes with fail-fast design and the `__debug__` flag.

## assert

```python
def mean(xs):
    assert len(xs) > 0, "mean of an empty sequence"
    return sum(xs) / len(xs)
```

`assert condition, message` raises `AssertionError(message)` when the condition is false. It compiles to a check that exists **only when `__debug__` is true**: running with `python -O` strips every `assert` from the bytecode. That single fact decides what an assertion may be used for:

- **Yes:** stating an invariant (`assert 0 <= i < len(xs)`), a postcondition (`assert result >= 0`), an assumption about internal state, a "this branch is unreachable" marker. If it fires, there is a bug in the program.
- **No:** validating user input, checking a file exists, guarding against a bad argument from a caller outside your control, anything whose failure is *possible in correct code*. Under `-O` the check vanishes and the bad input sails through.
- **Never:** an assertion with a side effect (`assert xs.pop()`), which disappears under `-O` along with the effect.

A second trap: `assert (cond, "message")` — parentheses make a non-empty tuple, which is always true, so the assertion never fires. Recent versions warn about it.

## Validation at the boundary

Input arrives at a boundary — `main`, a request handler, a public function of a library — and is checked there, once, converting a vague failure into a specific exception with a helpful message:

```python
def set_port(value):
    if not isinstance(value, int) or isinstance(value, bool):
        raise TypeError(f"port must be an int, got {type(value).__name__}")
    if not 1 <= value <= 65535:
        raise ValueError(f"port must be 1–65535, got {value}")
    self._port = value
```

`TypeError` for the wrong kind of thing; `ValueError` for the right kind with a bad value. Check the *type* first only when duck typing is not enough — usually a range or format check on the value is all that is needed, and `isinstance` is reserved for cases like `bool` masquerading as `int`. Once validated at the boundary, interior code may *assert* the property rather than re-check it, because a violation there is now a bug.

## Fail fast

The earlier a failure surfaces, the closer it is to its cause. A bad configuration should fail at start-up, not on the first request that uses it; a malformed record should fail when parsed, not when summed. Concretely: validate in constructors and setters (Module 8) so an object is never in a bad state; convert input as it is read; raise rather than substituting a default when the default would mask the problem. The cost of a loud failure is a traceback; the cost of a quiet one is a wrong answer nobody notices.

## The validation toolkit

- **Ranges and enumerations:** `if not lo <= x <= hi: raise ValueError(...)`; `if kind not in VALID: raise ValueError(f"kind must be one of {sorted(VALID)}, got {kind!r}")`.
- **Formats:** `re.fullmatch` for shapes, `int()`/`float()` in `try` for numbers, `datetime.strptime` for dates.
- **Structure:** `match` with class or mapping patterns for nested data (Module 3); dataclass `__post_init__` (Module 8).
- **Type at the boundary:** `isinstance` against an ABC or protocol, so anything with the right behaviour passes.
- **Non-negotiable preconditions in a library:** raise; the caller is another programmer and wants the traceback.

Every message names the expected and the actual. A caller reading `ValueError: invalid input` learns nothing; `ValueError: quantity must be positive, got -3` fixes the bug.

## Defensive, not paranoid

Defensive code checks what it *cannot trust* — external input, the results of I/O, arguments from another module — and trusts what it has already established. Re-validating the same value at every level, wrapping every call in `try`, and testing `if xs is not None` after a function documented to return a list are not defence; they are noise that hides the checks that matter. The shape to aim for: a thin layer at the edge that validates and converts, an interior that asserts its invariants and otherwise assumes them, and exceptions that propagate from where they arise to the boundary that can report them.

## __debug__ and configuration

`__debug__` is `True` unless the interpreter was started with `-O`. Code that should run only in development — expensive consistency checks, verbose tracing — can be guarded by `if __debug__:`, and is removed by `-O` just as asserts are. Production deployments rarely use `-O` (the speed gain is small), but libraries must be written as if they might, which is the reason for the rule above: never assert what must be checked.

## Pitfalls

- `assert` to validate input.
- `assert (cond, msg)` — always true.
- An assertion with a side effect.
- Validating deep inside instead of at the boundary, so the same value is checked in five places or none.
- Substituting a default for bad input silently.
- A message that says only that something is wrong.

## Key takeaways

- `assert` documents an invariant and fails in development; `-O` removes it, so it must never guard input or have side effects.
- Validate external input once, at the boundary, with `TypeError`/`ValueError` and a message naming the expected and actual.
- Fail fast: reject bad state in constructors, at parse time, at start-up — a traceback beats a wrong answer.
- Interior code asserts what the boundary established and otherwise trusts it.
- `assert (x, "msg")` is a tuple and never fires; `if __debug__:` guards development-only checks.
