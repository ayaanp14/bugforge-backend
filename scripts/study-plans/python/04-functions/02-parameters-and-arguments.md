---
title: Parameters and arguments — positional, keyword, defaults, *args and **kwargs
minutes: 15
---
Python's calling convention is richer than most languages': arguments can be passed by position or by name, parameters can have defaults, a function can accept any number of positional or keyword arguments, and a signature can *forbid* one style or the other. Every part of that is useful and one part — a mutable default — is the most famous bug in the language. This lesson takes the signature apart piece by piece, gives the ordering rule that ties the pieces together, and shows the unpacking that goes the other way, from a list or dict into a call.

## Positional and keyword arguments

```python
def greet(name, greeting):
    return f"{greeting}, {name}!"

greet("Ada", "Hello")                  # positional: matched by order
greet(greeting="Hi", name="Ada")       # keyword: matched by name, any order
greet("Ada", greeting="Hi")            # mixed: positionals first
```

Positional arguments must come before keyword arguments in a call. Passing the same parameter twice, or a keyword that does not exist, is a `TypeError`. Keyword arguments make a call readable when the parameters are of the same type — `move(x=3, y=4)` rather than `move(3, 4)` — and let you skip defaults in the middle of a signature.

## Default values

```python
def power(base, exponent=2):
    return base ** exponent

power(3)         # 9
power(3, 3)      # 27
power(3, exponent=3)
```

Parameters with defaults must come after those without (`def f(a=1, b)` is a syntax error). The default expression is evaluated **once, when the `def` runs**, and the resulting object is stored with the function and reused by every call that omits the argument. For an immutable default that is invisible. For a mutable one it is the bug:

```python
def append_to(x, xs=[]):      # one list, created at def time, shared by all calls
    xs.append(x)
    return xs

print(append_to(1))           # [1]
print(append_to(2))           # [1, 2]   — not [2]
```

The idiom is a `None` sentinel and a fresh object inside:

```python
def append_to(x, xs=None):
    if xs is None:
        xs = []
    xs.append(x)
    return xs
```

The same applies to `{}`, `set()`, and any call whose result is meant to be fresh per invocation (`time.time()` as a default is evaluated once, at definition).

## *args and **kwargs

A parameter named `*args` collects extra positional arguments into a **tuple**; `**kwargs` collects extra keyword arguments into a **dict**. The names are conventional; the stars are the syntax.

```python
def log(level, *messages, **fields):
    text = " ".join(str(m) for m in messages)
    extras = ", ".join(f"{k}={v}" for k, v in fields.items())
    return f"[{level}] {text} {extras}".rstrip()

log("INFO", "started", "ok", user="ada", pid=42)
# '[INFO] started ok user=ada, pid=42'
```

`*args` is how `print` accepts any number of values and how `max(1, 2, 3)` works. `**kwargs` is how a wrapper forwards options it does not itself understand. A function that takes `*args, **kwargs` and passes them on unchanged is the shape of every decorator (Module 16).

## Keyword-only and positional-only parameters

A bare `*` in the signature makes everything after it keyword-only; a `/` makes everything before it positional-only:

```python
def connect(host, port, *, timeout=10, retries=3):   # timeout and retries must be named
    ...
connect("db", 5432, timeout=5)
connect("db", 5432, 5)          # TypeError: takes 2 positional arguments but 3 were given

def divmod_(a, b, /):                                # a and b cannot be passed by name
    ...
```

Keyword-only parameters stop a call like `connect("db", 5432, 5, 2)` whose meaning nobody can read; they are the right choice for boolean flags and options. Positional-only parameters (3.8) let a library rename its parameters later without breaking callers, and are what most built-ins use (`len(obj=xs)` is a `TypeError`).

The full ordering of a signature is: positional-only, `/`, ordinary, `*args` or `*`, keyword-only, `**kwargs`:

```python
def f(pos_only, /, normal, *args, kw_only, **kwargs): ...
```

## Unpacking at the call

The stars work in the other direction too. `f(*seq)` spreads a sequence into positional arguments; `f(**mapping)` spreads a dict into keyword arguments:

```python
point = (3, 4)
move(*point)                           # move(3, 4)

options = {"timeout": 5, "retries": 1}
connect("db", 5432, **options)         # connect("db", 5432, timeout=5, retries=1)

print(*range(5))                       # 0 1 2 3 4
first, *rest = [1, 2, 3]               # the same star in an assignment
```

A common shape is a function that takes a list and a function that takes separate arguments meeting through a star: `max(*xs)` versus `max(xs)` both work, and the former fails on an empty list with a different error.

## Arguments are objects, not copies

Every argument is passed the same way: the parameter name is bound to the same object the caller passed. Nothing is copied. A function can mutate a list or dict it receives and the caller sees it; it cannot rebind the caller's name (Module 2 lesson 4). Say in the docstring which you do — "modifies `xs` in place" or "returns a new list" — and never both.

## Pitfalls

- A mutable default. Use `None` and create inside.
- Positional arguments after keyword ones in a call.
- Too many positional arguments where keyword-only was meant; `*` protects.
- `f(xs)` versus `f(*xs)` — passing one list versus its elements.
- Forgetting that `*args` is a tuple (immutable) and `**kwargs` a dict.
- Shadowing a parameter by assigning to it and then expecting the caller to see the change.

## Key takeaways

- Arguments match by position then by name; keywords make same-typed arguments readable.
- Defaults are evaluated once at `def` time — never use a mutable default; use `None`.
- `*args` gathers extra positionals into a tuple, `**kwargs` extra keywords into a dict; `*` and `/` make parameters keyword-only or positional-only.
- Signature order: positional-only `/`, ordinary, `*args`, keyword-only, `**kwargs`.
- `f(*seq)` and `f(**dict)` unpack into a call; every argument is the caller's object, not a copy.
