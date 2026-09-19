---
title: Attribute access — __getattr__, __getattribute__, __setattr__, __dict__ and __slots__
minutes: 13
---
Every dot in Python is a call: `obj.x` runs `type(obj).__getattribute__(obj, "x")`, and `obj.x = v` runs `__setattr__`. Three hooks let a class intercept those calls — `__getattr__` for names that were not found, `__getattribute__` for every read, `__setattr__`/`__delattr__` for every write — and with `__dict__`, `getattr`/`setattr`/`hasattr` and `__slots__` they are the toolkit for proxies, dynamic attributes, immutable objects and attribute-based APIs. This lesson gives each hook its exact trigger, the recursion trap in the write hooks, the reflection functions, and the judgement of when interception is worth its opacity.

## __getattr__: only on failure

```python
class Config:
    def __init__(self, data):
        self._data = data

    def __getattr__(self, name):                 # called ONLY when normal lookup fails
        try:
            return self._data[name]
        except KeyError:
            raise AttributeError(name) from None

cfg = Config({"host": "db", "port": 5432})
cfg.host, cfg.port                               # 'db', 5432 — dict keys as attributes
cfg._data                                        # a real attribute: __getattr__ is not involved
cfg.missing                                      # AttributeError — as it should be
```

`__getattr__` is the fallback: normal lookup (instance dict, class, descriptors, bases) runs first, and only a failure reaches it. That makes it cheap and safe — real attributes are unaffected — and the right tool for delegation (Module 9's `__getattr__` forwarding to a wrapped object) and for exposing dict keys or remote fields as attributes. Two rules: raise `AttributeError` for names you do not handle, so `hasattr` and `getattr(obj, name, default)` keep working; and remember that dunder lookups (`len(obj)`, `obj[i]`) bypass it, because the interpreter looks special methods up on the *type*.

## __getattribute__: on every read

```python
class Traced:
    def __getattribute__(self, name):
        value = super().__getattribute__(name)   # NEVER self.name here — infinite recursion
        print(f"read {name}")
        return value
```

`__getattribute__` intercepts *every* attribute read, including those inside its own body — `self.x` inside it calls itself again, forever. Always delegate to `super().__getattribute__` (or `object.__getattribute__(self, name)`). It is rarely the right tool: it is slower than every other approach and hides ordinary reads; `__getattr__`, a descriptor or a property almost always does the job.

## __setattr__ and __delattr__: on every write

```python
class Frozen:
    def __init__(self, **fields):
        for k, v in fields.items():
            object.__setattr__(self, k, v)       # bypass our own hook during construction
        object.__setattr__(self, "_frozen", True)

    def __setattr__(self, name, value):
        if getattr(self, "_frozen", False):
            raise AttributeError(f"{type(self).__name__} is immutable")
        object.__setattr__(self, name, value)

    def __delattr__(self, name):
        raise AttributeError("immutable")
```

`__setattr__` runs on every assignment, including `self.x = …` in `__init__`, so the hook must write through `object.__setattr__` (or `super().__setattr__`) to avoid calling itself. This is how frozen dataclasses refuse assignment (`FrozenInstanceError` is an `AttributeError`), how validation on every field is done without a descriptor per field, and how a proxy forwards writes. The same recursion rule applies to `__delattr__`.

## __dict__ and vars

```python
p = Point(1, 2)
p.__dict__                         # {'x': 1, 'y': 2}
vars(p) is p.__dict__              # True
p.__dict__["z"] = 3                # adds an attribute, bypassing __setattr__
Point.__dict__                     # a read-only mappingproxy of the class namespace
```

The instance dict is the ordinary storage; `vars(obj)` is the polite spelling. Writing to it directly skips the hooks, which is occasionally the point (a frozen class's constructor) and usually a hack.

## The reflection functions

```python
getattr(obj, "x")                  # obj.x; AttributeError if absent
getattr(obj, "x", default)         # with a fallback
setattr(obj, "x", 5)               # obj.x = 5 — through __setattr__
delattr(obj, "x")
hasattr(obj, "x")                  # True/False; internally getattr + except AttributeError
dir(obj)                           # the names, including inherited; __dir__ customises it
```

These take the attribute name as a *string*, which is what configuration-driven code needs: `setattr(self, key, value)` for each key of a dict, `getattr(module, function_name)` for a plugin, `getattr(self, f"handle_{command}")` for dispatch by name. A `hasattr` check followed by `getattr` is two lookups; `getattr` with a default is one.

## __slots__ again

`__slots__ = ("x", "y")` replaces the per-instance `__dict__` with fixed slots — smaller, faster to access, and a typo in an attribute name is an `AttributeError` rather than a silent new attribute (Module 8). The hooks above still apply (slots are descriptors underneath). Subclasses without their own `__slots__` regain a `__dict__`; `__slots__ = ()` in a subclass keeps the restriction. With `__slots__`, `vars(obj)` raises, so code that reflects over instances must use `dir` or the class's `__slots__`.

## Dynamic attributes: when and when not

Exposing dict keys, environment variables or remote fields as attributes (`cfg.host`) reads well and is what `types.SimpleNamespace` does for free: `SimpleNamespace(**d)` gives a plain object with those attributes and a readable `repr`. The cost is opacity: an editor cannot complete `cfg.host`, a type checker cannot verify it, a typo becomes a run-time `AttributeError` (or worse, a silently created attribute on a proxy without `__setattr__`). Use dynamic attributes at boundaries where the field set is genuinely open; use a dataclass where it is known.

## Pitfalls

- `self.x` inside `__getattribute__` or `self.x = v` inside `__setattr__` — infinite recursion.
- `__getattr__` that returns `None` for unknown names instead of raising `AttributeError`, breaking `hasattr`.
- Expecting `__getattr__` to intercept `len()`, `+` or indexing.
- Writing to `__dict__` to dodge validation.
- `__slots__` on a class whose subclasses forget it, silently reinstating `__dict__`.
- Dynamic attributes for data whose shape is fixed and known.

## Key takeaways

- `__getattr__` runs only when normal lookup fails — the delegation and dict-as-attributes hook; raise `AttributeError` for the rest.
- `__getattribute__` runs on every read and must delegate to `super()`; it is rarely the tool.
- `__setattr__`/`__delattr__` run on every write, including in `__init__`; write through `object.__setattr__`.
- `getattr`/`setattr`/`hasattr`/`delattr` take names as strings; `vars`/`__dict__` is the storage; `SimpleNamespace` is the ready-made attribute bag.
- Special methods bypass instance hooks; `__slots__` removes `__dict__` and catches typos.
