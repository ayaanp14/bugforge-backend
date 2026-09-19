---
title: Exceptions — try, except, else, finally, raise
minutes: 14
---
An exception is an object that interrupts normal control flow: raised at the point of failure, it unwinds the call stack until a handler catches it, running cleanup blocks on the way, or reaches the top and ends the program with a traceback. Python uses exceptions for everything from `KeyError` to the end of a file, so handling them well is not an edge-case skill but the normal texture of the code. This lesson covers the full `try` statement, the standard hierarchy and how to choose what to catch, `raise` in its forms, re-raising and chaining with `from`, and the difference between catching an error and hiding it.

## The statement

```python
try:
    n = int(text)                  # the code that may raise
except ValueError:
    print("not a number")          # runs only if a ValueError was raised in the try block
else:
    print(n * 2)                   # runs only if nothing was raised
finally:
    print("done")                  # always runs — after the try, after any handler, even on return or re-raise
```

Execution enters `try`; if an exception is raised there, the interpreter looks for a matching `except` clause in order and runs the first that matches; if none matches, the exception propagates to the caller. `else` runs when the `try` block completed without raising — it keeps code that should not be protected by the handler *out* of the `try`. `finally` runs no matter what, which makes it the place for cleanup (though `with` is usually better — lesson 4).

Keep the `try` block small: only the statements that can raise the exception you mean to handle. A `try` wrapping fifty lines catches a `ValueError` from any of them and hides the one you did not expect.

## Matching exceptions

```python
except ValueError:                    # this class or any subclass
except (ValueError, TypeError):       # any of several
except ValueError as e:               # bind the exception object
    print(e)                          # the message; e.args holds the constructor arguments
except Exception:                     # everything that is a normal error
except:                               # everything, including KeyboardInterrupt and SystemExit — almost never right
```

Handlers are tried top to bottom, and a handler matches an exception of its class *or any subclass*. So `except Exception` before `except ValueError` makes the second unreachable; order specific to general. A bare `except:` also catches `KeyboardInterrupt` (Ctrl-C) and `SystemExit` (from `sys.exit`), which is why it turns a program into one that cannot be stopped; `except Exception` is the widest handler that is ever appropriate, and it belongs at a boundary — a request handler, a worker loop — with logging, not in ordinary code.

## The hierarchy

```text
BaseException
├── SystemExit, KeyboardInterrupt, GeneratorExit
└── Exception
    ├── ArithmeticError → ZeroDivisionError, OverflowError
    ├── LookupError → IndexError, KeyError
    ├── ValueError → UnicodeError
    ├── TypeError
    ├── AttributeError, NameError
    ├── OSError → FileNotFoundError, PermissionError, TimeoutError
    ├── RuntimeError → RecursionError, NotImplementedError
    ├── StopIteration, AssertionError, ImportError, …
```

`LookupError` catches both an `IndexError` and a `KeyError`; `OSError` catches every file and network failure; `ArithmeticError` both division and overflow. Catching a parent is right when the handling is the same for all its children. `Exception` is the base for your own exception classes (next lesson).

## raise

```python
raise ValueError("age must be positive")      # an instance, with a message
raise ValueError                              # the class; an instance is created with no message
raise                                         # inside a handler: re-raise the current exception unchanged
```

Raise the built-in exception whose *meaning* fits: `ValueError` for a right-typed but wrong-valued argument, `TypeError` for a wrong type, `KeyError`/`IndexError` for a missing key/position, `RuntimeError` for a state that should not happen, `NotImplementedError` for an abstract operation. The message should say what was wrong *and* what was received — `f"expected 1–10, got {n}"` — because it is what the person reading the traceback sees.

## Re-raising and chaining

A handler that cannot fully deal with an exception should pass it on:

```python
try:
    value = parse(text)
except ValueError:
    log("bad input")
    raise                                     # the original traceback is preserved

try:
    config = json.loads(text)
except json.JSONDecodeError as e:
    raise ConfigError(f"invalid config: {e}") from e     # explicit chaining: "The above exception was the direct cause"
```

When an exception is raised *inside* a handler, Python chains them automatically ("During handling of the above exception, another exception occurred") so both tracebacks show. `raise X from e` marks `e` as the *cause*, which reads better; `raise X from None` suppresses the chain when the original is noise — the right choice when translating an internal exception into one the caller expects.

## Where exceptions come from

Built-in operations raise them (`int("x")`, `d[k]`, `xs[99]`, `1/0`, `open("missing")`); library calls raise them (`json.loads`, `re.compile`, `datetime.strptime`); your own `raise`; and `assert`. Everything that can fail in Python fails by raising — there are no error codes to check — which is why unchecked results are not a Python bug class, and why *swallowing* exceptions is.

## Catching versus hiding

```python
try:
    total = compute(rows)
except Exception:
    total = 0                    # the bug is now invisible: a wrong total instead of a traceback
```

A handler must do something meaningful: recover (retry, use a default the caller understands), translate (raise a better exception), report (log and re-raise), or clean up (`finally`). A handler that turns a failure into a plausible-looking result hides the bug until it corrupts something further away. If you do not know what to do with an exception, do not catch it.

## Pitfalls

- A bare `except:` or a broad `except Exception:` deep inside logic.
- A `try` block that covers more than the call that can raise.
- Handlers in general-to-specific order, making the specific ones dead.
- Catching and returning `None` or `0`, converting a loud failure into a silent wrong answer.
- `raise e` inside a handler instead of `raise` — it rewrites the traceback's origin to the handler.
- Forgetting that `finally` runs even after a `return` in the `try`, and that a `return` in `finally` overrides everything.

## Key takeaways

- `try`/`except`/`else`/`finally`: handle what raised, run `else` on success, `finally` always; keep the `try` small.
- Handlers match a class or its subclasses, top to bottom; specific before general; `except Exception` only at boundaries; never bare `except:`.
- Raise the built-in whose meaning fits, with a message that says what was expected and what arrived.
- Bare `raise` re-raises; `raise X from e` chains with a cause; `from None` suppresses the chain.
- Catch only to recover, translate, report or clean up — a handler that hides a failure is worse than none.
