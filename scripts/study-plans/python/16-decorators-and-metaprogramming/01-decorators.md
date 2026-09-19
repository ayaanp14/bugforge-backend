---
title: Decorators — functions that wrap functions
minutes: 15
---
A decorator is a function that takes a function and returns a function, and the `@name` line above a `def` is only syntax for `f = name(f)`. Everything else follows: a decorator can add behaviour before or after every call (logging, timing, retrying, caching), replace the function entirely, register it somewhere, or check its arguments — without touching the body. Module 4's closures and Module 11's `functools.wraps` were the preparation. This lesson builds decorators from the plain form up: the wrapper shape, `@wraps`, decorators with arguments (three levels of `def`), stacking order, class decorators, and the standard ones you already use.

## The desugaring

```python
def shout(fn):
    def wrapper(*args, **kwargs):
        result = fn(*args, **kwargs)
        return result.upper()
    return wrapper

@shout
def greet(name):
    return f"hello {name}"

# is exactly:
def greet(name):
    return f"hello {name}"
greet = shout(greet)

greet("ada")          # 'HELLO ADA'
```

`shout` receives the original function, defines `wrapper` — a closure over `fn` — and returns it; the name `greet` is rebound to `wrapper`. `*args, **kwargs` let the wrapper accept whatever the original does and pass it through. The decorator runs *once, at definition time*; the wrapper runs *on every call*.

## @wraps

```python
from functools import wraps

def shout(fn):
    @wraps(fn)                       # copies __name__, __doc__, __qualname__, __module__, sets __wrapped__
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs).upper()
    return wrapper

greet.__name__                       # 'greet', not 'wrapper'
greet.__wrapped__                    # the original, for tests and introspection
```

Without `@wraps`, every decorated function reports its name as `wrapper` in tracebacks, `help()` and test output, and `inspect.signature` shows `(*args, **kwargs)`. It is one line and it is not optional.

## The common wrappers

```python
def logged(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}{args}")
        result = fn(*args, **kwargs)
        print(f"{fn.__name__} returned {result!r}")
        return result
    return wrapper

def count_calls(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1           # state on the wrapper function object
        return fn(*args, **kwargs)
    wrapper.calls = 0
    return wrapper

def memoize(fn):
    cache = {}                       # state in the closure
    @wraps(fn)
    def wrapper(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]
    return wrapper
```

Before/after behaviour, a counter, a cache: the state lives either in the closure (`cache`) or as an attribute on the wrapper (`wrapper.calls`), and the wrapper always returns what the original returned unless transforming the result is the point.

## Decorators with arguments

`@retry(3)` is a call that *returns* a decorator, so the function has three levels:

```python
def retry(times):                            # 1. takes the arguments
    def decorator(fn):                       # 2. takes the function
        @wraps(fn)
        def wrapper(*args, **kwargs):        # 3. runs on each call
            last = None
            for _ in range(times):
                try:
                    return fn(*args, **kwargs)
                except TransientError as e:
                    last = e
            raise last
        return wrapper
    return decorator

@retry(3)
def fetch(): ...
# fetch = retry(3)(fetch)
```

The outer function is a *decorator factory*. A decorator that works both bare (`@retry`) and with arguments (`@retry(3)`) is possible but confusing; pick one form.

## Stacking

```python
@logged
@memoize
def slow(n): ...
# slow = logged(memoize(slow))
```

Decorators apply bottom-up: the one nearest the `def` wraps first, the top one wraps last and runs *outermost* on a call. Here `logged` sees every call, including the ones `memoize` answers from cache; swapped, only cache misses would be logged. Order matters whenever wrappers have side effects.

## Decorating methods and classes

A decorator on a method receives the function before it is bound; `self` arrives as `args[0]` in the wrapper, so the generic `*args, **kwargs` shape works unchanged. A **class decorator** takes the class and returns it (or a replacement), the shape of `@dataclass`, `@total_ordering` and `@runtime_checkable`:

```python
def register(cls):
    REGISTRY[cls.__name__] = cls
    return cls

@register
class CsvExporter: ...

def add_repr(cls):
    def __repr__(self):
        fields = ", ".join(f"{k}={v!r}" for k, v in vars(self).items())
        return f"{type(self).__name__}({fields})"
    cls.__repr__ = __repr__
    return cls
```

Registering plugins, adding methods, validating a class's attributes — all by decorating the class at definition time.

## A decorator as a class

Anything callable can decorate, so a class with `__init__(self, fn)` and `__call__(self, *args, **kwargs)` is a decorator whose state is ordinary attributes rather than closure cells:

```python
import functools

class CountCalls:
    def __init__(self, fn):
        functools.update_wrapper(self, fn)     # the class-form of @wraps
        self.fn = fn
        self.calls = 0

    def __call__(self, *args, **kwargs):
        self.calls += 1
        return self.fn(*args, **kwargs)

@CountCalls
def ping(): ...
ping(); ping.calls          # 1
```

The class form reads better when the wrapper has several pieces of state or methods of its own (`reset`, `stats`); the function form is shorter for one behaviour. One caveat: a class-based decorator on a *method* is not a descriptor unless it defines `__get__`, so `self` is not bound — the function form (a closure) has that for free.

## The ones you already use

`@property`, `@staticmethod`, `@classmethod` (descriptors, lesson 3); `@functools.cache`, `@lru_cache`, `@wraps`, `@singledispatch`, `@total_ordering`; `@dataclass`; `@contextmanager`; `@abstractmethod`; `@runtime_checkable`; `@unittest.mock.patch`; `pytest.fixture`; Flask's and FastAPI's route decorators. Every one is `name(thing)` returning a replacement — nothing more.

## Pitfalls

- No `@wraps` — tracebacks and `help` show `wrapper`.
- A wrapper that forgets to `return` the result.
- A wrapper with a fixed signature (`def wrapper(x)`) that breaks on keyword arguments.
- Confusing the factory (`retry(3)`) with the decorator (`retry`).
- Stacking in the wrong order.
- Doing expensive work at decoration time by accident (it runs at import).

## Key takeaways

- `@deco` above `def f` is `f = deco(f)`; the decorator runs once, the wrapper on every call.
- A wrapper takes `*args, **kwargs`, calls the original, returns its result, and carries `@wraps(fn)`.
- State lives in the closure or on the wrapper object; `@retry(3)` is a factory returning a decorator.
- Stacked decorators apply bottom-up and run outermost-first; class decorators take and return a class.
- Every standard decorator is the same mechanism.
