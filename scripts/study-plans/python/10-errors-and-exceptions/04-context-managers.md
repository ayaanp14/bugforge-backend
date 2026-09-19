---
title: Context managers — with, __enter__/__exit__ and contextlib
minutes: 14
---
`with open(path) as f:` closes the file when the block ends — on success, on `return`, on an exception — and that guarantee is the *context manager protocol*: an object with `__enter__` and `__exit__`. Files, locks, database transactions, temporary directories, timers, redirected output and "restore this setting afterwards" are all the same shape: set something up, run a block, tear it down no matter how the block ends. This lesson covers the statement, the two methods and what `__exit__` receives, writing a manager as a class and as a generator with `@contextmanager`, the helpers in `contextlib`, and the relationship to `try`/`finally`.

## The statement

```python
with open("data.txt") as f:
    data = f.read()
# f is closed here, whether read() succeeded or raised

with open("a.txt") as src, open("b.txt", "w") as dst:      # several, entered left to right, exited right to left
    dst.write(src.read())
```

`with expr as name:` calls `expr.__enter__()`, binds its return value to `name` (a file's `__enter__` returns the file itself), runs the block, then calls `expr.__exit__(...)`. The `as` part is optional when the entered object is not needed (`with lock:`). Since 3.10 several managers may be grouped in parentheses across lines.

`with` is exactly this `try`/`finally`:

```python
manager = expr
value = manager.__enter__()
try:
    name = value
    ...block...
except BaseException as e:
    if not manager.__exit__(type(e), e, e.__traceback__):
        raise
else:
    manager.__exit__(None, None, None)
```

## Writing one as a class

```python
class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self                          # what `as` binds

    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.start
        return False                         # do not suppress exceptions

with Timer() as t:
    work()
print(f"{t.elapsed:.3f}s")
```

`__exit__` receives the exception's type, instance and traceback — all `None` when the block completed normally. Returning a truthy value **suppresses** the exception; returning `False`/`None` lets it propagate after the cleanup. Suppressing is rare and deliberate (`contextlib.suppress` is that, generalised); most managers clean up and return `False`. `__exit__` runs even if the block executed `return`, `break` or `continue`.

A commit-or-rollback manager is the classic use:

```python
class Transaction:
    def __init__(self, db):
        self.db = db

    def __enter__(self):
        self.db.begin()
        return self.db

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            self.db.commit()
        else:
            self.db.rollback()
        return False
```

## Writing one as a generator

`contextlib.contextmanager` turns a generator into a manager: everything before `yield` is `__enter__`, the yielded value is what `as` binds, everything after is `__exit__`:

```python
from contextlib import contextmanager

@contextmanager
def cd(path):
    old = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(old)

@contextmanager
def transaction(db):
    db.begin()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    else:
        db.commit()
```

The `try`/`finally` around the `yield` is what makes the teardown run when the block raises — the exception is re-raised *at the yield* inside the generator. Without it, an exception in the block skips the code after `yield`. This form is shorter than the class for anything that is just setup/teardown; the class form is right when the manager has methods or state callers use.

## contextlib helpers

| Helper | Use |
| --- | --- |
| `suppress(*exc)` | ignore listed exceptions in the block |
| `closing(obj)` | call `obj.close()` on exit, for objects with `close` but no `__exit__` |
| `redirect_stdout(f)`, `redirect_stderr(f)` | send prints to another stream — `io.StringIO()` to capture output in a test |
| `nullcontext(x)` | a no-op manager that yields `x`; for "optionally use a manager" code paths |
| `ExitStack()` | enter a variable number of managers and exit them all in reverse |

```python
import io
from contextlib import redirect_stdout, ExitStack

buf = io.StringIO()
with redirect_stdout(buf):
    print("captured")
buf.getvalue()                       # 'captured\n'

with ExitStack() as stack:
    files = [stack.enter_context(open(p)) for p in paths]   # however many; all closed on exit
    ...
```

`ExitStack` is the answer to "open N files" and to conditional managers; it also takes `stack.callback(fn, *args)` for arbitrary cleanup. `asynccontextmanager` and `AsyncExitStack` are the async equivalents (Module 17).

## Reusable and reentrant managers

A manager built with `@contextmanager` is single-use: the generator runs once, so entering the same object twice raises `RuntimeError`. A class-based manager can be reused (each `with` calls `__enter__` afresh) and, if it keeps no per-entry state, entered again while already active — `threading.RLock` is the standard reentrant example. Keep the per-entry state on the instance in `__enter__` (as `Timer` does with `start`) and the manager is safe to use in a loop; store nothing and it is safe to nest.

## Resources that need this

Files (`open`), locks (`threading.Lock` — `with lock:`), sockets and connections, `tempfile.TemporaryDirectory()`, `decimal.localcontext()`, `warnings.catch_warnings()`, `unittest.mock.patch`, `subprocess.Popen`, `zipfile.ZipFile`, database connections and cursors. If an object has `close()`, it almost certainly supports `with`; if it does not, `closing()` makes it. The rule: any resource that must be released is acquired in a `with`.

## Pitfalls

- Opening a file without `with` and relying on garbage collection to close it (unreliable timing, a `ResourceWarning` under `-X dev`).
- `@contextmanager` without `try`/`finally` around the `yield`, so teardown is skipped on error.
- `__exit__` returning `True` accidentally (a helper's return value leaking) and silently swallowing exceptions.
- Doing work that can fail in `__enter__` after acquiring a resource — if it raises, `__exit__` does not run; acquire last.
- Nesting `with` blocks deeply when one line with commas, or `ExitStack`, would do.
- A generator manager that yields twice (`RuntimeError`).

## Key takeaways

- `with` calls `__enter__`, runs the block, and always calls `__exit__` — the `try`/`finally` written once, on the type.
- `__exit__(exc_type, exc, tb)` gets the exception or three `None`s; return `False` to propagate, `True` to suppress.
- `@contextmanager` on a generator: setup, `yield`, teardown in a `finally`.
- `suppress`, `closing`, `redirect_stdout`, `nullcontext`, `ExitStack` cover the common needs; `ExitStack` for a variable number of managers.
- Every resource that must be released is acquired in a `with`.
