---
title: Descriptors — how properties, methods and validated attributes work
minutes: 14
seo-title: Python Descriptors Explained: How Property and Methods Work
description: A Python descriptor is a class attribute with get and set hooks run on access. How property and bound methods work, and data vs non-data descriptors.
question: What is a descriptor in Python?
answer: A descriptor in Python is an object that defines `__get__`, and optionally `__set__` or `__delete__`, and is stored as a class attribute. When an instance or the class looks that attribute up, Python calls those methods instead of returning the object itself. `property`, `classmethod`, `staticmethod`, `functools.cached_property`, plain functions becoming bound methods and ORM columns are all descriptors.
q: What is the difference between a data and a non-data descriptor?
a: A data descriptor defines `__set__` or `__delete__` and wins over the instance `__dict__`; a non-data descriptor defines only `__get__` and loses to it. That is why an instance attribute cannot shadow a `property` but can shadow a method.
q: How does `@property` work in Python?
a: `property` is a data descriptor that stores a getter, a setter and a deleter. Its `__get__` calls the getter with the instance, and its `__set__` calls the setter or raises `AttributeError` when there is none, which is why a read-only property refuses assignment. `@x.setter` returns a new property with the setter added.
q: What is `__set_name__` for?
a: Python calls `__set_name__(owner, name)` on each descriptor when the class is created, telling it which attribute name it was assigned to. One validating descriptor class can then guard several attributes and store each value on the instance under a private name such as `_price`.
q: How do methods become bound methods in Python?
a: Functions are non-data descriptors. Looking a function up through an instance calls `function.__get__(obj, cls)`, which returns a bound method with the instance fixed as the first argument; `classmethod` binds the class instead, and `staticmethod` returns the plain function.
q: How does `functools.cached_property` work?
a: It is a non-data descriptor that computes the value on first access and writes it into the instance `__dict__` under the same name. Later lookups find the instance attribute first, so the function never runs again; deleting the attribute clears the cache.
---
`@property` is not magic, and neither is the way `obj.method` becomes a bound method. Both are *descriptors*: objects with `__get__` (and optionally `__set__`/`__delete__`) that the attribute machinery consults when they are found on a class. Understanding the protocol explains `property`, `classmethod`, `staticmethod`, `functools.cached_property`, dataclass fields, ORM columns and every "attribute that computes or validates" you will meet. This lesson states the protocol, walks through the lookup order it plugs into, builds a validated-attribute descriptor with `__set_name__`, re-derives `property` from it, and explains data versus non-data descriptors — the distinction that decides who wins between the instance dict and the class.

## The protocol

```python
class Descriptor:
    def __get__(self, obj, objtype=None): ...    # obj is the instance, or None when accessed on the class
    def __set__(self, obj, value): ...           # optional: makes it a *data* descriptor
    def __delete__(self, obj): ...               # optional
    def __set_name__(self, owner, name): ...     # optional: told the attribute name at class creation (3.6)
```

A descriptor is any object defining `__get__`; it takes effect only when it is a *class* attribute and is looked up through an instance or the class. `obj.attr` with a descriptor on the class calls `type(obj).__dict__["attr"].__get__(obj, type(obj))` instead of returning the descriptor itself.

## The lookup order

`obj.x` proceeds:

1. Look for `x` on `type(obj)` and its MRO. If it is a **data descriptor** (has `__set__` or `__delete__`), call its `__get__` — it wins over everything.
2. Otherwise, if `x` is in `obj.__dict__`, return that.
3. Otherwise, if the class attribute is a **non-data descriptor** (only `__get__`), call its `__get__`.
4. Otherwise return the class attribute as is; failing that, `__getattr__` (next lesson); failing that, `AttributeError`.

Assignment `obj.x = v` checks the class for a data descriptor first (calling its `__set__`), else writes `obj.__dict__["x"]`. This ordering is why a `property` (data descriptor) cannot be shadowed by an instance attribute, while a method (non-data) can.

## A validated attribute

```python
class Positive:
    def __set_name__(self, owner, name):
        self.name = name                       # "price"
        self.storage = "_" + name              # "_price"

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self                        # class access returns the descriptor
        return getattr(obj, self.storage)

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"{self.name} must be positive, got {value}")
        setattr(obj, self.storage, value)

class Item:
    price = Positive()
    qty = Positive()

    def __init__(self, price, qty):
        self.price = price                     # goes through Positive.__set__
        self.qty = qty

Item(5, 0)          # ValueError: qty must be positive, got 0
Item.price          # <Positive object> — obj is None
```

One descriptor class, reused for every attribute that needs the rule, with `__set_name__` telling each instance which attribute it guards. The per-object value is stored on the object under a private name, because the descriptor itself is shared by every instance of the class — storing the value on the descriptor would make every `Item` share one price.

## property is a descriptor

```python
class property:                                # simplified
    def __init__(self, fget=None, fset=None, fdel=None):
        self.fget, self.fset, self.fdel = fget, fset, fdel
    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        if self.fget is None:
            raise AttributeError("unreadable attribute")
        return self.fget(obj)
    def __set__(self, obj, value):
        if self.fset is None:
            raise AttributeError("can't set attribute")
        self.fset(obj, value)
    def setter(self, fset):
        return type(self)(self.fget, fset, self.fdel)
```

`@property` stores the getter in a data descriptor; `@x.setter` returns a new property with the setter added. That is the whole mechanism, and it is why a property with no setter refuses assignment (its `__set__` raises) and why it cannot be overridden by writing to `__dict__`.

## Methods are descriptors too

A plain function has `__get__`: `function.__get__(obj, cls)` returns a *bound method* with `obj` fixed as the first argument. That is the step that turns `Class.method` (a function) into `instance.method` (a bound method) — a non-data descriptor, which is why an instance attribute of the same name can shadow a method. `staticmethod` wraps a function in a descriptor whose `__get__` returns the function unchanged; `classmethod`'s `__get__` binds the class instead of the instance. All three are the same protocol with different `__get__`s.

## cached_property

```python
class cached_property:                         # simplified
    def __init__(self, func):
        self.func = func
    def __set_name__(self, owner, name):
        self.name = name
    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        value = self.func(obj)
        obj.__dict__[self.name] = value        # store on the instance…
        return value
```

A *non-data* descriptor that writes the computed value into the instance dict: on the next access, step 2 of the lookup finds the instance attribute first and the descriptor never runs again. Deleting the instance attribute clears the cache. The absence of `__set__` is the design.

## Where descriptors appear

Dataclass fields with defaults, ORM columns (`Column(Integer)` in SQLAlchemy, `models.CharField` in Django), `enum` members, `unittest.mock` attributes, validation libraries, lazily loaded resources. Whenever an attribute on a class does something at access time, a descriptor is doing it.

## Pitfalls

- Storing per-instance state on the descriptor object, which is shared.
- Forgetting `if obj is None: return self`, so class-level access crashes.
- Expecting an instance attribute to override a property (it cannot — data descriptors win).
- Defining a descriptor as an *instance* attribute (the protocol only fires on the class).
- Omitting `__set__` when validation is wanted (a non-data descriptor is bypassed by assignment).
- Reinventing `property`, `cached_property` or `functools.total_ordering`.

## Key takeaways

- A descriptor is a class attribute with `__get__` (and optionally `__set__`/`__delete__`); attribute access on an instance calls those methods.
- Data descriptors (with `__set__`) beat the instance dict; non-data descriptors lose to it — the order behind properties, methods and `cached_property`.
- `__set_name__` tells a descriptor its attribute name; store per-instance values on the instance, not on the descriptor.
- `property`, `staticmethod`, `classmethod` and plain functions are all descriptors with different `__get__`s.
- Reach for a descriptor when the same access-time rule applies to several attributes or classes.
